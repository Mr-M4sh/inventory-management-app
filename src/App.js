import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://braminventory-backend.onrender.com";

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: ""
  });

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  // Add product
  const addProduct = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price) return
