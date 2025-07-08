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
  // Catch all unmatched routes
  {
    path: "*",
    element: <NotFound />,
  },
], {
  // Add error handling for router itself
  future: {
    v7_normalizeFormMethod: true,
  }
})

export default router
