import { useState } from "react";
import axios from "axios";
import { config } from "../config";

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await axios.post(
        `${config.apiUrl}/auth/login`,
        {
          username,
          password,
        },
        { withCredentials: true }
      );

      onLogin();
    } catch (error) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm w-full p-6 bg-white border border-gray-300 rounded-lg">
        <h2 className="flex items-center gap-2 text-3xl mb-4 font-thin">
          <span className="ic">lock</span>Login
        </h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-xs mb-1 opacity-50">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-3 py-2 w-full border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-xs mb-1 opacity-50">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 w-full border border-gray-300 rounded-md"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <button
            type="submit"
            className="flex items-center justify-between w-full bg-blue-700/20 border border-blue-700/20 text-blue-700 px-6 py-4 rounded-md"
          >
            Login <span className="ic">east</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
