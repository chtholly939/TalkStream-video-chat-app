import { useState } from "react";
import { useNavigate } from "react-router";
import { verifyOtp } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import ThemeSelector from "../components/ThemeSelector";
import { ShipWheelIcon } from "lucide-react";
import { Link } from "react-router";

const VerifyPage = () => {
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await verifyOtp({ otp });

      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        navigate("/");
      }
    } catch (error) {
      setErrorMsg(
        error?.response?.data?.message || "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">

      {/* 🔥 Navbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2">
          <ShipWheelIcon className="size-7 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            TalkStream
          </span>
        </Link>

        <ThemeSelector />
      </div>

      {/* 🔥 Center Content */}
      <div className="flex flex-1 items-center justify-center px-4">
        <form
          onSubmit={handleVerify}
          className="bg-base-200 w-full max-w-md p-8 rounded-2xl shadow-xl space-y-5"
        >
          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold">Verify your email</h2>
            <p className="text-sm opacity-70">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Input */}
          <input
            type="text"
            placeholder="Enter OTP"
            className="input input-bordered w-full text-center tracking-widest text-lg"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />

          {/* Error */}
          {errorMsg && (
            <div className="alert alert-error text-sm">
              {errorMsg}
            </div>
          )}

          {/* Button */}
          <button
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          {/* Resend */}
          <div className="text-center text-sm">
            Didn’t receive code?{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
            >
              Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyPage;