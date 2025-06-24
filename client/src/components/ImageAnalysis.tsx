
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
    setMessageOverride
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
      setMessageOverride("🧠 Thank you for your image - our AI is analyzing it now... Please wait.");

      try {
        console.log("Starting image analysis...");
        const response = await apiRequest("/api/analyze-foot-image", {
          method: "POST",
          body: JSON.stringify({ imageBase64: imagePath })
        });

        console.log("Analysis response:", response);

        let resultText;
        if (response?.condition && response.condition !== "Unable to analyze image") {
          resultText = `📋 **AI Assessment Complete**\n\n🦶 **Condition:** ${response.condition}\n**Severity:** ${response.severity}\n\n**Recommendations:**\n${response.recommendations.map(r => `• ${r}`).join('\n')}\n\n⚠️ ${response.disclaimer}`;
        } else {
          resultText = "⚠️ Our AI analysis is complete, but we'd like to gather more information from you to provide the best assessment.";
        }

        updateUserData({ imageAnalysisResults: response });
        setMessageOverride(resultText);
        
        setIsLoading(false);
        setTimeout(() => {
          handleNextStep();
        }, 3000);
      } catch (error) {
        console.error("Image analysis error:", error);
        setMessageOverride("⚠️ Our image analysis service is temporarily unavailable. Let's continue with describing your symptoms.");
        setIsLoading(false);
        setTimeout(() => {
          handleNextStep();
        }, 2000);
      }
    };

    // Start analysis after a brief delay
    setTimeout(() => {
      analyzeImage();
    }, 800);
  }, [userData.imagePath, updateUserData, handleNextStep, setIsLoading, setMessageOverride]);

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
