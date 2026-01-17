import { useState } from "react";
import axios from "axios";
import FormInput from "../components/FormInput";
import { useNavigate } from "react-router-dom";

export default function Register() {
//za navigaciju nakon uspesnog registrovanja
  const navigate = useNavigate();

  //neke promenljive za menjanje
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  //svaki put kad imamo promenu na formu, azuriraju se vrednosti u zavisnosti koje polje se azurira
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
  };

  //fja za registraciju, pozivamo backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/register", form);

      if (res.data.success) {
        setMessage("Registration successful! Redirecting...");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      setMessage(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="formPage">
      <h1>Register</h1>
      {message && <p className="form-message">{message}</p>}
      <form onSubmit={handleSubmit} className="form">
        <FormInput
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name?.[0]}
        />
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email?.[0]}
        />
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password?.[0]}
        />
        <button type="submit" className="ctaButton">Register</button>
      </form>
    </div>
  );
}
