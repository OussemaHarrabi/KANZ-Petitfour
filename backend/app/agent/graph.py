"""LangGraph agent for investment advisory with CMF compliance."""

from __future__ import annotations

import os
from typing import Annotated, List, Optional, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from app.agent import tools as agent_tools


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


SYSTEM_PROMPT = (
    "You are an AI investment assistant for the Tunisian market. "
    "Provide clear guidance using prediction, anomaly detection, and sentiment tools. "
    "Always ensure advice is compliant with CMF (Conseil du Marché Financier) regulations. "
    "Use CMF regulation search when compliance questions arise. "
    "Be concise and avoid giving instructions that could violate market rules."
)


def _get_llm():
    groq_key = os.getenv("GROQ_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    if groq_key:
        from langchain_groq import ChatGroq

        model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
        return ChatGroq(model=model, temperature=0.2, api_key=groq_key)

    if openai_key:
        from langchain_openai import ChatOpenAI

        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return ChatOpenAI(model=model, temperature=0.2, streaming=True)

    if anthropic_key:
        from langchain_anthropic import ChatAnthropic

        model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620")
        return ChatAnthropic(model=model, temperature=0.2, streaming=True)

    raise RuntimeError("Missing GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY")


@tool
def get_stock_prediction(stock_code: str):
    """Get ML-based stock price prediction for a given stock code."""
    return agent_tools.get_stock_prediction(stock_code)


@tool
def get_anomaly_detection(stock_code: str):
    """Detect trading anomalies for a given stock code."""
    return agent_tools.get_anomaly_detection(stock_code)


@tool
def get_sentiment_analysis(stock_code: str):
    """Analyze market sentiment for a given stock code."""
    return agent_tools.get_sentiment_analysis(stock_code)


@tool
def search_cmf_regulations(query: str):
    """Search CMF regulations for compliance guidance."""
    return agent_tools.search_cmf_regulations(query)


def _build_graph():
    llm = _get_llm()
    tools = [
        get_stock_prediction,
        get_anomaly_detection,
        get_sentiment_analysis,
        search_cmf_regulations,
    ]

    llm_with_tools = llm.bind_tools(tools)

    def agent_node(state: AgentState):
        messages = [SystemMessage(content=SYSTEM_PROMPT), *state["messages"]]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(tools))
    graph.add_conditional_edges("agent", tools_condition)
    graph.add_edge("tools", "agent")
    graph.set_entry_point("agent")
    return graph.compile()


_GRAPH = None


def get_graph():
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = _build_graph()
    return _GRAPH


def invoke_agent(messages: List[BaseMessage]):
    graph = get_graph()
    state = graph.invoke({"messages": messages})
    return state


async def stream_agent(messages: List[BaseMessage]):
    graph = get_graph()
    last_message_id: Optional[str] = None
    async for state in graph.astream({"messages": messages}, stream_mode="values"):
        if not state or "messages" not in state or not state["messages"]:
            continue
        message = state["messages"][-1]
        if isinstance(message, AIMessage) and message.content:
            if message.id != last_message_id:
                last_message_id = message.id
                yield message.content


def build_messages(history: Optional[List[dict]], user_message: str) -> List[BaseMessage]:
    messages: List[BaseMessage] = []
    if history:
        for item in history:
            role = item.get("role")
            content = item.get("content", "")
            if not content:
                continue
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
            elif role == "system":
                messages.append(SystemMessage(content=content))
    messages.append(HumanMessage(content=user_message))
    return messages
