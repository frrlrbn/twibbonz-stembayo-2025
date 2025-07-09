import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import Panitia from './Panitia.jsx'
import NotFound from './NotFound.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
  },
  {
    path: "/panitia",
    element: <Panitia />,
    errorElement: <NotFound />,
  },
  // Catch all unmatched routes
  {
    path: "*",
    element: <NotFound />,
  },
], {
  basename: import.meta.env.BASE_URL || '/',
  future: {
    v7_normalizeFormMethod: true,
  }
})

export default router
