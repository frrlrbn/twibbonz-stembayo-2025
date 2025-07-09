import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import Panitia from './Panitia.jsx'
import NotFound from './NotFound.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/panitia", 
    element: <Panitia />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])

export default router
