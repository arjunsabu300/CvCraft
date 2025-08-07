import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ResumeCustomizerApp from './Frontend/Front';
import WelcomeAnimation from './Frontend/Welcome';

export default function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeAnimation/>} />
        <Route path="/home" element={<ResumeCustomizerApp/>} />
        
      </Routes>
    </BrowserRouter>

  )
}