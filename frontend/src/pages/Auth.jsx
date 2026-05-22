import { useState } from "react";
import Login from "../components/Login.jsx";
import SignUp from "../components/SignUp.jsx";
import { Gamepad2, Zap, Trophy, Users } from "lucide-react";

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [message, setMessage] = useState(null);

  return (
    <div className="min-h-screen bg-bg font-body grain flex items-center justify-center p-6 overflow-hidden">
      {/* Geometric background */}
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-60" />
      
      {/* Animated floating shapes */}
      <div className="fixed top-20 left-[10%] w-32 h-32 rounded-full bg-accent/15 blur-3xl animate-float" />
      <div className="fixed bottom-20 right-[10%] w-40 h-40 rounded-full bg-violet/15 blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      <div className="fixed top-1/3 right-[15%] w-24 h-24 rounded-full bg-emerald/15 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="fixed bottom-1/3 left-[15%] w-28 h-28 rounded-full bg-amber/15 blur-3xl animate-float" style={{ animationDelay: '-1s' }} />
      
      {/* Floating game icons */}
      <div className="fixed top-[15%] left-[8%] text-accent/20 animate-float" style={{ animationDelay: '-1.5s' }}>
        <Gamepad2 size={40} />
      </div>
      <div className="fixed top-[25%] right-[12%] text-violet/20 animate-float" style={{ animationDelay: '-0.5s' }}>
        <Trophy size={36} />
      </div>
      <div className="fixed bottom-[20%] left-[12%] text-emerald/20 animate-float" style={{ animationDelay: '-2.5s' }}>
        <Zap size={32} />
      </div>
      <div className="fixed bottom-[30%] right-[8%] text-amber/20 animate-float" style={{ animationDelay: '-3.5s' }}>
        <Users size={38} />
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fadeIn" style={{ animationDuration: '0.6s' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
            <Gamepad2 className="w-8 h-8 text-accent" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-text mb-2">
            Miles <span className="text-accent animate-pulse">&</span> Smiles
          </h1>
          <p className="text-text-secondary">
            {activeTab === "login" ? "Welcome back, player!" : "Join the arena"}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 animate-fadeIn" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }}>
          {/* Message toast */}
          {message && (
            <div
              className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium border animate-fadeIn
              ${message.type === "success" ? "bg-emerald-soft text-emerald border-emerald/20" : ""}
              ${message.type === "error" ? "bg-accent-soft text-accent border-accent/20" : ""}
              ${message.type === "info" ? "bg-violet-soft text-violet border-violet/20" : ""}
            `}
            >
              {message.text}
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex bg-bg-deep rounded-xl p-1.5 mb-8">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 px-4 rounded-lg font-display font-medium text-sm transition-all ${
                activeTab === "login"
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 px-4 rounded-lg font-display font-medium text-sm transition-all ${
                activeTab === "signup"
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <div className="transition-all duration-300">
            {activeTab === "login" ? (
              <Login onMessage={setMessage} />
            ) : (
              <SignUp onMessage={setMessage} />
            )}
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center mt-6 text-text-muted text-sm animate-fadeIn" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }}>
          {activeTab === "login" ? (
            <>
              New here?{" "}
              <button 
                onClick={() => setActiveTab("signup")}
                className="text-accent hover:underline font-medium"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button 
                onClick={() => setActiveTab("login")}
                className="text-accent hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
