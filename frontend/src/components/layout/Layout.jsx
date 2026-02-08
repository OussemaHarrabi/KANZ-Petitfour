import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Chatbot } from '../chatbot/Chatbot'

export function InvestorLayout() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar role="investor" />
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  )
}

export function InspectorLayout() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar role="inspector" />
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
