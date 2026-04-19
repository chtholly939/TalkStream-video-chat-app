import { useMutation } from "@tanstack/react-query";
import { signup } from "../lib/api";
import { useNavigate } from "react-router";

const useSignUp = () => {
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      // 🔥 redirect to OTP page instead of trying to login
      navigate("/verify");
    },
  });

  return { isPending, error, signupMutation: mutate };
};

export default useSignUp;