import React from "react";
import { Box } from "@mui/material";

interface AuthIllustration {
  src: string;
}

const SignupIllustration: React.FC<AuthIllustration> = ({ src }) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "500px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={src}
        alt="auth illustration"
        style={{
          width: "100%",
          height: "auto",
          maxWidth: "750px",
        }}
      />
    </Box>
  );
};

export default SignupIllustration;
