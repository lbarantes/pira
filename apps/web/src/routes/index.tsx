import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getCurrentUser } from '@/api'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  // const navigate = useNavigate()

  // useEffect(() => {
  //   // Se estiver autenticado, vai para dashboard
  //   // Se não, vai para login
  //   const user = getCurrentUser()
  //   if (user) {
  //     navigate({ to: '/dashboard' })
  //   } else {
  //     navigate({ to: '/login' })
  //   }
  // }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Carregando...</p>
      </div>
    </div>
  )
}
