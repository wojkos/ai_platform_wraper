import { useState, useEffect } from 'react'
import Login from './components/Login'
import Layout from './components/Layout'

const API_URL = 'http://localhost:8080'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [modules, setModules] = useState([])
  const [selectedModule, setSelectedModule] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchModules()
    }
  }, [token])

  const fetchModules = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setModules(data)
        // Select first available module by default
        const firstAvailable = data.find(m => m.available)
        if (firstAvailable && !selectedModule) {
          setSelectedModule(firstAvailable)
        }
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setModules([])
    setSelectedModule(null)
  }

  if (!token) {
    return <Login onLogin={handleLogin} apiUrl={API_URL} />
  }

  return (
    <Layout
      modules={modules}
      selectedModule={selectedModule}
      onSelectModule={setSelectedModule}
      onLogout={handleLogout}
      loading={loading}
    />
  )
}

export default App
