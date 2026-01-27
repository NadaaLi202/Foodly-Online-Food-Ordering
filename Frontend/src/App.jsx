import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignupPage from './Pages/Register';
import Login from './Pages/login';
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<SignupPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
