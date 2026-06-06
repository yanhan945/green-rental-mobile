import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REGISTER_SUCCESS_MESSAGE = "注册成功，请前往邮箱点击确认链接，确认完成后返回本页面登录。";

function getFriendlyAuthError(message = "") {
  const text = String(message || "").toLowerCase();

  if (!text) return "认证失败，请稍后重试。";
  if (text.includes("invalid login credentials")) return "邮箱或密码不正确，请检查后重试。";
  if (text.includes("email not confirmed") || text.includes("not confirmed")) return "邮箱还没有确认，请先前往邮箱点击确认链接。";
  if (text.includes("user already registered") || text.includes("already registered")) return "这个邮箱已经注册过，请直接登录。";
  if (text.includes("password") && text.includes("weak")) return "密码强度不够，请换一个更安全的密码。";
  if (text.includes("password") && text.includes("6")) return "密码至少需要 6 位。";
  if (text.includes("email")) return "邮箱格式或邮箱状态异常，请检查后重试。";
  if (text.includes("rate limit")) return "操作太频繁，请稍等一会儿再试。";

  return "登录或注册失败，请检查邮箱和密码后重试。";
}

export function AuthPage({ session, onSignedOut }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const credentials = { email: email.trim(), password };
      const result = mode === "register"
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);

      if (result.error) {
        setError(getFriendlyAuthError(result.error.message));
        return;
      }

      if (mode === "register") {
        await supabase.auth.signOut();
        setPassword("");
        setMode("login");
        setMessage(REGISTER_SUCCESS_MESSAGE);
        return;
      }

      setMessage("登录成功，正在进入系统。");
    } catch (authError) {
      setError(getFriendlyAuthError(authError?.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    setError("");
    const result = await supabase.auth.signOut();
    setLoading(false);

    if (result.error) {
      setError(result.error.message || "退出登录失败。");
      return;
    }

    onSignedOut?.();
  }

  return (
    <main className="auth-page-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <span>G</span>
          <div>
            <p>GardenOS Account</p>
            <h1>{session ? "账号已登录" : mode === "login" ? "邮箱登录" : "邮箱注册"}</h1>
          </div>
        </div>

        {session ? (
          <div className="auth-session-card">
            <p>当前登录邮箱</p>
            <strong>{session.user?.email || "-"}</strong>
            <button onClick={handleSignOut} disabled={loading}>{loading ? "退出中..." : "退出登录"}</button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>邮箱</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="name@example.com" required />
            </label>
            <label>
              <span>密码</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="至少 6 位密码" required minLength={6} />
            </label>

            {error && <div className="auth-alert error">{error}</div>}
            {message && <div className="auth-alert success">{message}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
            </button>
          </form>
        )}

        {!session && (
          <div className="auth-switch-row">
            <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
          </div>
        )}

        <p className="auth-note">统一使用邮箱 + 密码登录。登录后会进入对应工作台。</p>
      </section>
    </main>
  );
}
