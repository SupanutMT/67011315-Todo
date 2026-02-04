// src/components/OAuthSuccess.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function OAuthSuccess({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      const user = {
        id: decoded.id,
        username: decoded.username,
        fullName: decoded.full_name,
        profileImage: decoded.profile_image,
        authProvider: decoded.auth_provider,
      };

      localStorage.setItem("todo_user", JSON.stringify(user));
      onLogin(user);

      navigate("/");
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/");
    }
  }, [navigate, onLogin]);

  return (
    <div className="text-white text-lg font-semibold">
      Logging in...
    </div>
  );
}

export default OAuthSuccess;
