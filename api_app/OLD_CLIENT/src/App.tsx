import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import axios from "axios";
import "./App.css";

import ListGroup from "./components/ListGroup";

function App() {
  const items = ["Ny", "CA", "SF", "FL", "VA"];
  const handleSelectItem = (item: string) => {};

  return (
    <div>
      <ListGroup items={items} heading="cities" onSelectItem={}></ListGroup>
    </div>
  );
}

export default App;

// const apiCall = () => {
//   axios.get('http://localhost:3000/api/courses/').then((data) => {
//     //this console.log will be in our frontend console
//     console.log(data)
//   })
// }

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <button onClick={apiCall}>Make API Call</button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
