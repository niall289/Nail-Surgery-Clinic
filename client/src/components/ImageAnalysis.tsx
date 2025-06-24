import React, { useEffect } from "react";
import { useChatContext } from "@/lib/ChatContext";
import { apiRequest } from "@/lib/apiRequest";
import NurseAvatar from "./ui/NurseAvatar";

const ImageAnalysis: React.FC = () => {
  const {
    userData,
    updateUserData,
    handleNextStep,
    setIsLoading,
    setMessageOverride
  } = useChatContext();

  useEffect(() => {
    const analyzeImage = async () => {
      const imagePath = userData.imagePath;

      if (!imagePath || imagePath.length < 100) {
        setMessageOverride("⚠️ No valid image found. Please try uploading again.");
        handleNextStep();
        return;
      }

      setIsLoading(true);
      setMessageOverride("🧠 Analyzing your image... Please wait.");

      try {
        const response = await apiRequest("/api/analyze-foot-image", {
          method: "POST",
          body: JSON.stringify({ imageBase64: imagePath })
        });

        const resultText = response?.condition
          ? `📋 **AI Assessment**\n\n🦶 Condition: **${response.condition}**\nSeverity: *${response.severity}*\n\nRecommendations:\n- ${response.recommendations.join("\n- ")}\n\n📝 ${response.disclaimer}`
          : "⚠️ AI analysis completed, but no specific issue was detected. Please describe your symptoms manually.";

        updateUserData({ imageAnalysisResults: response });
        setMessageOverride(resultText);
      } catch (error) {
        console.error("Image analysis error:", error);
        setMessageOverride("⚠️ Image analysis failed. Please describe your symptoms manually.");
      }

      setIsLoading(false);
      setTimeout(() => handleNextStep(), 3000);
    };

    analyzeImage();
  }, []);

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
