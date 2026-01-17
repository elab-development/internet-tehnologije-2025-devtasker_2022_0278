import { useState } from "react";
import axios from "axios";
import FormInput from "../components/FormInput";
import { useNavigate } from "react-router-dom";

function getHomeRoute(role) {
  switch (role) {
    case "product_owner":
      return "/projects";
    case "developer":
      return "/my-tasks";
    case "taskadmin":
      return "/tags";
    default:
      return "/";
  }
}

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setMessage("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login", form);

      if (res.data?.success) {
        const { token, user } = res.data.data;

        // update app state + session storage (jedno mesto)
        onLoginSuccess({ token, user });

        //redirect na role-home
        navigate(getHomeRoute(user.role), { replace: true });
        return;
      }

      // fallback ako backend vrati success=false bez throw
      setMessage(res.data?.message || "Login failed.");
      setErrors(res.data?.errors || {});
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setMessage(err.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="formPage">
      <h1>Login</h1>
      {message && <p className="form-message">{message}</p>}

      <form onSubmit={handleSubmit} className="form">
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email?.[0] || errors.auth?.[0]}
        />

        <FormInput
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password?.[0]}
        />

        <button type="submit" className="ctaButton">
          Login
        </button>
      </form>
    </div>
  );
}
