"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    else router.push("/votar");
  };

  return (
    <div>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        placeholder="Contraseña"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Ingresar</button>
    </div>
  );
}
