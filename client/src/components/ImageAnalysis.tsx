import React, { useEffect } from "react";
import { useChatContext } from "@/components/lib/ChatContext";
import { apiRequest } from "@/lib/apiRequest";
import NurseAvatar from "./ui/NurseAvatar";

const ImageAnalysis: React.FC = () => {
  const {
    userData,
    updateUserData,
    handleNextStep,
    setIsLoading,
    setMessageOverride,
  } = useChatContext();

  useEffect(() => {
    const analyzeImage = async () => {
      const imagePath = userData.imagePath;

      if (!imagePath || imagePath.length < 100) {
        setMessageOverride("⚠️ No valid image found. Please try uploading again.");
        setTimeout(() => {
          setMessageOverride("Moving to the next step...");
          setTimeout(() => handleNextStep(), 1000);
        }, 1500);
        return;
      }

      setIsLoading(true);
      setMessageOverride("🧠 Thank you for your image - our AI is analyzing it now...");

      try {
        console.log("🧠 Sending image to API for analysis...");

        const response = await apiRequest("/api/analyze-foot-image", {
          method: "POST",
          body: JSON.stringify({ imageBase64: imagePath }),
        });

        console.log("✅ Analysis response:", response);

        const valid = response?.condition && response.condition !== "Unable to analyze image";

        if (valid) {
          updateUserData({ imageAnalysisResults: response });
          setMessageOverride({
            type: "analysis",
            data: response,
          });
        } else {
          console.warn("⚠️ No valid condition returned from image analysis");
          setMessageOverride({
            type: "analysis",
            data: {
              condition: "Unable to analyze image",
              severity: "N/A",
              recommendations: ["Please try again or describe your symptoms manually."],
              disclaimer: "This is not a medical diagnosis.",
            },
          });
        }
      } catch (error) {
        console.error("❌ Image analysis error:", error);
        setMessageOverride("⚠️ Our image analysis service is temporarily unavailable. Let's continue.");
      }

      setIsLoading(false);
      setTimeout(() => {
        handleNextStep();
      }, 3000);
    };

    setTimeout(() => {
      analyzeImage();
    }, 800);
  }, [userData.imagePath]);

  return (
    <div className="flex items-start gap-3 mt-4">
      <NurseAvatar />
      <div className="bg-muted p-3 rounded-xl text-sm">
        🧠 Processing your image...
      </div>
    </div>
  );
};

export default ImageAnalysis;
