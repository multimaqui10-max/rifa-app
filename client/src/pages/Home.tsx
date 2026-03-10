"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket, Gift, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [sessionId] = useState(() => {
    const id = localStorage.getItem("sessionId");
    if (id) return id;
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("sessionId", newId);
    return newId;
  });

  const { data: raffleData, isLoading: isLoadingRaffle } = trpc.raffle.getConfig.useQuery();
  const { data: numbers, isLoading: isLoadingNumbers } = trpc.raffle.getNumbers.useQuery({});
  const { data: winnerData } = trpc.draw.getWinner.useQuery();
  const reserveNumberMutation = trpc.raffle.reserveNumber.useMutation();

  const config = raffleData?.config;
  const prizes = raffleData?.prizes || [];

  const availableCount = numbers?.filter((n) => n.status === "available").length || 0;
  const soldCount = numbers?.filter((n) => n.status === "sold").length || 0;
  const reservedCount = numbers?.filter((n) => n.status === "reserved").length || 0;

  if (isLoadingRaffle || isLoadingNumbers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-bold gradient-text">{config?.raffleTitle || "Mi Rifa"}</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && user.role === "admin" && (
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="border-accent text-accent hover:bg-accent/10"
              >
                Panel Admin
              </Button>
            )}
            {user ? (
              <Button
                onClick={() => (window.location.href = "/api/auth/logout")}
                variant="outline"
              >
                Logout
              </Button>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-accent hover:bg-accent/90"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Winner Section - if published */}
      {winnerData?.isPublished && (
        <section className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
          <div className="container py-8">
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <h2 className="text-2xl font-bold mb-4 text-purple-900">🎉 ¡GANADOR DEL SORTEO!</h2>
              <div className="space-y-2">
                <p className="text-lg" style={{color: '#ff0000'}}><strong style={{color: '#ff0000'}}>Número Ganador:</strong> <span className="text-3xl font-bold text-accent" style={{color: '#ff0000'}}>{winnerData.winnerNumber}</span></p>
                <p className="text-lg"><strong>Ganador:</strong> {winnerData.firstName} {winnerData.lastName}</p>
                <p className="text-sm text-muted-foreground">Sorteo realizado el {winnerData.drawnAt ? new Date(winnerData.drawnAt).toLocaleDateString('es-CL') : 'N/A'}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="container py-12 sm:py-16 lg:py-20">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                Participa en nuestra <span className="gradient-text">RIFA</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                {config?.raffleDescription || "Selecciona tus números de la suerte y gana increíbles premios."}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-elevated p-4">
                <p className="text-sm text-muted-foreground mb-1">Disponibles</p>
                <p className="text-3xl font-bold text-green-600">{availableCount}</p>
              </div>
              <div className="card-elevated p-4">
                <p className="text-sm text-muted-foreground mb-1">Vendidos</p>
                <p className="text-3xl font-bold text-accent">{soldCount}</p>
              </div>
              <div className="card-elevated p-4">
                <p className="text-sm text-muted-foreground mb-1">Reservados</p>
                <p className="text-3xl font-bold text-yellow-600">{reservedCount}</p>
              </div>
            </div>

            {/* Key Info */}
            <div className="space-y-3">
              {config?.drawDate && (
                <div className="flex items-center gap-3 text-lg">
                  <Calendar className="w-5 h-5 text-accent" />
                  <span>
                    <strong>Sorteo:</strong> {format(new Date(config.drawDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                </div>
              )}
              {config?.numberPrice && (
                <div className="flex items-center gap-3 text-lg">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <span>
                    <strong>Valor por número:</strong> {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(Number(config.numberPrice)).replace('CLP', '').trim()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Prizes */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 text-accent" />
              Premio
            </h3>
            <div className="space-y-3">
              {prizes.length > 0 ? (
                prizes.map((prize, idx) => (
                  <Card key={prize.id} className="border-l-4 border-l-accent overflow-hidden">
                    {prize.imageUrl && (
                      <div className="w-full h-48 overflow-hidden">
                        <img
                          src={prize.imageUrl}
                          alt={prize.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{prize.position}º Premio</CardTitle>
                          <CardDescription>{prize.title}</CardDescription>
                        </div>
                        {prize.value && <span className="text-xl font-bold text-accent">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(Number(prize.value)).replace('CLP', '').trim()}</span>}
                      </div>
                    </CardHeader>
                    {prize.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{prize.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">Premios por definir</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Numbers Grid Section */}
      <section className="container py-12 sm:py-16">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">Selecciona tus números</h2>
          <p className="text-muted-foreground">Haz clic en los números disponibles para reservarlos</p>
        </div>

        <div className="card-elevated p-6 sm:p-8">
          <div className="number-grid">
            {numbers?.map((num) => (
              <button
                key={num.id}
                onClick={() => {
                  if (num.status === "available") {
                    navigate(`/checkout/${num.id}`);
                  }
                }}
                disabled={num.status !== "available"}
                className={`number-item ${
                  num.status === "available"
                    ? "number-available"
                    : num.status === "reserved"
                      ? "number-reserved"
                      : "number-sold"
                }`}
                title={
                  num.status === "available"
                    ? "Disponible"
                    : num.status === "reserved"
                      ? "Reservado"
                      : "Vendido"
                }
              >
                {num.number}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-border bg-white"></div>
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-yellow-300 bg-yellow-100"></div>
            <span className="text-sm">Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-accent bg-accent opacity-60"></div>
            <span className="text-sm">Vendido</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16 py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2024 {config?.raffleTitle || "Mi Rifa"}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
