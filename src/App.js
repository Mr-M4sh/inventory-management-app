import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://braminventory-backend.onrender.com/api";

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/products`)
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Inventory Management App ✅</h1>

      <h3>Products from Database:</h3>
      <ul>
        {products.map((p, i) => (
          <li key={i}>
            {p.name} - Rs {p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
