import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import bcrypt from "bcryptjs";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PELAYAN");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roleOptions = [
    {
      id: "PELAYAN",
      label: "Waiter (Pelayan)",
      description: "Manage table orders & service workflow",
      icon: "🍷",
    },
    {
      id: "KOKI",
      label: "Chef (Koki)",
      description: "Kitchen order preparation & queue management",
      icon: "👨‍🍳",
    },
    {
      id: "KASIR",
      label: "Cashier (Kasir / Admin)",
      description: "Billing, table status & admin control",
      icon: "💳",
    },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!name || !email || !password || !role) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // 1. Check if email already exists in Supabase 'users' table
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.trim())
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        if (checkError.status === 403 || checkError.code === "42501" || checkError.message?.toLowerCase().includes("permission")) {
          setError("Supabase 403 Forbidden: Enable RLS Policy or run 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;' in Supabase SQL Editor.");
          setLoading(false);
          return;
        }
      }

      if (existingUser) {
        setError("Email is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }

      // 2. Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Insert new user into 'users' table
      const { error: insertError } = await supabase.from("users").insert([
        {
          name: name.trim(),
          email: email.trim(),
          password: hashedPassword,
          role: role,
        },
      ]);

      if (insertError) {
        // If table schema uses 'nama' instead of 'name', attempt fallback insert
        const { error: fallbackError } = await supabase.from("users").insert([
          {
            nama: name.trim(),
            email: email.trim(),
            password: hashedPassword,
            role: role,
          },
        ]);

        if (fallbackError) {
          if (fallbackError.status === 403 || fallbackError.code === "42501" || fallbackError.message?.toLowerCase().includes("permission")) {
            setError("Supabase 403 Forbidden: Enable RLS Policy or run 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;' in Supabase SQL Editor.");
          } else {
            setError(`Database Error: ${fallbackError.message}`);
          }
          setLoading(false);
          return;
        }
      }

      setSuccess("Account registered successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="glass max-w-lg w-full rounded-2xl p-8 relative overflow-hidden z-10 my-8 shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="text-xl font-serif font-bold text-accent tracking-widest uppercase mb-2 inline-block"
          >
            Resto Unikom
          </Link>
          <h2 className="text-3xl font-bold text-primary mb-2">Create Account</h2>
          <p className="text-secondary text-sm">Register staff account with role assignment</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100/90 border border-red-300 text-red-700 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-100/90 border border-emerald-300 text-emerald-700 rounded-xl text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark/70 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark placeholder-gray-400 font-medium"
              placeholder="e.g. Budi Santoso"
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark/70 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark placeholder-gray-400 font-medium"
              placeholder="staff@resto.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark/70 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark placeholder-gray-400 font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark/70 mb-2">
              Select Staff Role
            </label>
            <div className="grid grid-cols-1 gap-3">
              {roleOptions.map((opt) => {
                const isSelected = role === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setRole(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-white/40 border-primary/15 hover:border-primary/40 text-dark/80"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">{opt.label}</span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                        )}
                      </div>
                      <p className="text-xs text-dark/60 mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-cream rounded-xl font-medium hover:bg-secondary transition-colors duration-300 shadow-md disabled:opacity-70 text-sm tracking-wide uppercase font-semibold mt-2"
          >
            {loading ? "Registering..." : "Create Staff Account"}
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center mt-6 pt-4 border-t border-primary/10">
          <p className="text-xs text-dark/60">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              Sign In Here
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute bottom-[20%] right-[30%] w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>
    </div>
  );
}
