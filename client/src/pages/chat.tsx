import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import ChatInterface from "@/components/ui/ChatInterface";
import type { Consultation } from "@shared/schema";

export default function Chat() {
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [botConfig, setBotConfig] = useState({
    botName: 'Fiona',
    avatarUrl: '',
    welcomeMessage: '',
    primaryColor: 'hsl(186, 100%, 30%)',
    clinicLocation: 'all',
    allowImageUpload: true,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const embedded = urlParams.get('embedded');

    if (embedded === 'true') {
      setIsEmbedded(true);

      const name = urlParams.get('botName');
      const avatar = urlParams.get('avatarUrl');
      const welcome = urlParams.get('welcomeMessage');
      const color = urlParams.get('primaryColor');
      const location = urlParams.get('clinicLocation');
      const imageUpload = urlParams.get('allowImageUpload');

      setBotConfig(prevConfig => ({
        ...prevConfig,
        botName: name || prevConfig.botName,
        avatarUrl: avatar || prevConfig.avatarUrl,
        welcomeMessage: welcome || prevConfig.welcomeMessage,
        primaryColor: color || prevConfig.primaryColor,
        clinicLocation: location || prevConfig.clinicLocation,
        allowImageUpload: imageUpload !== 'false',
      }));
    }
  }, []);

  const createConsultation = useMutation({
    mutationFn: async (data: Partial<Consultation>) => {
      const res = await apiRequest("POST", "/api/consultations", data);
      return res.json();
    },
    onSuccess: (data) => {
      setConsultationId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create consultation: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateConsultation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Consultation> }) => {
      const res = await apiRequest("PATCH", `/api/consultations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultations', consultationId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update consultation: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const { data: consultation } = useQuery<Consultation>({
    queryKey: ['/api/consultations', consultationId],
    queryFn: async () => {
      if (!consultationId) return undefined;
      const res = await apiRequest("GET", `/api/consultations/${consultationId}`);
      return res.json();
    },
    enabled: !!consultationId,
  });

  const handleCreateConsultation = (data: Partial<Consultation>) => {
    createConsultation.mutate(data);
  };

  const handleUpdateConsultation = (data: Partial<Consultation>) => {
    if (consultationId) {
      updateConsultation.mutate({ id: consultationId, data });
    }
  };

  return (
    <div className={`${isEmbedded ? 'bg-transparent' : 'bg-gray-100 min-h-screen'} flex flex-col justify-center items-center ${isEmbedded ? 'p-0' : 'p-4 md:p-0'}`}>
      <ChatInterface
        consultationId={consultationId}
        consultation={consultation}
        onCreateConsultation={(data) => {
          if (isEmbedded && botConfig.clinicLocation !== 'all') {
            handleCreateConsultation({
              ...data,
              preferred_clinic: botConfig.clinicLocation
            });
          } else {
            handleCreateConsultation(data);
          }
        }}
        onUpdateConsultation={handleUpdateConsultation}
        botName={botConfig.botName}
        avatarUrl={botConfig.avatarUrl}
        welcomeMessage={botConfig.welcomeMessage}
        primaryColor={botConfig.primaryColor}
      />
    </div>
  );
}
