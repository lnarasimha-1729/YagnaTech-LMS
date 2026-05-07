import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/api/authApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { message?: string; error?: string } } };
        setError(
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to send reset link. Please try again."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
      <div className="container-ngo max-w-md mx-auto py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/login" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </Button>
        </div>

        <Card className="card-ngo border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your registered email address below.<br />
              We'll send instructions to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className="w-full px-3 py-2"
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#177385] to-[#1bbf8a] text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  Reset link has been sent to your email address. Please check your inbox.
                </div>
                <Button variant="link" asChild>
                  <Link to="/login">Return to Login</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;