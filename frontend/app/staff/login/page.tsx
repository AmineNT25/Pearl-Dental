import LoginForm from "@/components/login-form";
export default function StaffLoginPage() {
  const configured = Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("username:password") && process.env.NEXTAUTH_SECRET);
  return <LoginForm configured={configured}/>;
}
