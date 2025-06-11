import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-8">
          <div className="text-center mb-6">
            <div className="h-28 mx-auto flex items-center justify-center mb-4">
              <img 
                src="/images/footcare-clinic-logo.png" 
                alt="FootCare Clinic Logo" 
                className="h-full" 
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">FootCare Clinic</h1>
            <p className="text-gray-600 mb-1">
              Welcome to our virtual foot care assistant
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Get help with foot problems and connect with our specialists
            </p>

            <Link href="/chat">
              <Button className="w-full py-6 text-base bg-primary hover:bg-primary-dark">
                Start Chat Consultation
              </Button>
            </Link>

            {/* Admin access removed from public view */}
          </div>

          <div className="space-y-4 mt-8">
            <h2 className="font-semibold text-lg text-gray-800">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Foot Pain Relief</span>
                </div>
              </div>
              <div className="p-3 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Nail Treatments</span>
                </div>
              </div>
              <div className="p-3 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Skin Conditions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin link removed for security */}
        </CardContent>
      </Card>
    </div>
  );
}