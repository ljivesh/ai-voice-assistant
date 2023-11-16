import "./App.css";
import SpeechToText from "./components/SpeechToText";
import Login from "./components/Login";
import { useAuth } from "./providers/Auth";

function App() {
  const { user } = useAuth();

  return user ? <SpeechToText /> : <Login />;
}

export default App;
