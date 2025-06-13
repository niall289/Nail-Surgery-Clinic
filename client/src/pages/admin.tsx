import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Consultation } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import ExportButton from '@/components/ui/ExportButton';
import AdminAuth from '@/components/AdminAuth';
import { formatDate } from '@/lib/utils';

export default function Admin() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if already authenticated via session storage on component mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch consultation data - only run query when authenticated
  const { data: consultations, isLoading, error } = useQuery({
    queryKey: ['/api/consultations', page, pageSize],
    queryFn: getQueryFn<Consultation[]>({ on401: 'throw' }),
    enabled: isAuthenticated, // Only fetch data if authenticated
  });

  // Handle pagination
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (consultations && consultations.length === pageSize) {
      setPage(page + 1);
    }
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Show admin dashboard if authenticated
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>The Nail Surgery Clinic Consultations</CardTitle>
            <CardDescription>
              View and export patient consultation data
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ExportButton className="ml-auto" />
            <Button 
              variant="outline" 
              onClick={() => {
                sessionStorage.removeItem('isAdminAuthenticated');
                setIsAuthenticated(false);
              }}
            >
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">Loading consultations...</div>
          ) : error ? (
            <div className="text-red-500 p-4">
              Error loading consultations. Please try again.
            </div>
          ) : !consultations || consultations.length === 0 ? (
            <div className="text-center p-8">
              No consultations found. When patients use the chatbot, their information will appear here.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Clinic</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell>{formatDate(consultation.createdAt)}</TableCell>
                        <TableCell>{consultation.name}</TableCell>
                        <TableCell>
                          <div>{consultation.phone}</div>
                          <div className="text-xs text-gray-500">{consultation.email}</div>
                        </TableCell>
                        <TableCell>{consultation.preferredClinic || 'Not specified'}</TableCell>
                        <TableCell>{consultation.issueCategory}</TableCell>
                        <TableCell>
                          {consultation.transferredToWhatsApp === 'yes' ? 'Transferred' : 'No'}
                        </TableCell>
                        <TableCell className="text-right">
                          <ExportButton consultationId={consultation.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={handlePrevPage} 
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink>Page {page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={handleNextPage} 
                      className={consultations && consultations.length < pageSize ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}