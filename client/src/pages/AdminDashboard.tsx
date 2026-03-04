import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const prizeSchema = z.object({
  position: z.string().min(1),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  value: z.string().optional(),
});

type PrizeFormData = z.infer<typeof prizeSchema>;

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"config" | "prizes" | "participants" | "transactions">("config");

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "config", label: "Configuración" },
            { id: "prizes", label: "Premios" },
            { id: "participants", label: "Participantes" },
            { id: "transactions", label: "Transacciones" },
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              variant={activeTab === tab.id ? "default" : "outline"}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "config" && <ConfigTab />}
        {activeTab === "prizes" && <PrizesTab />}
        {activeTab === "participants" && <ParticipantsTab />}
        {activeTab === "transactions" && <TransactionsTab />}
      </div>
    </div>
  );
}

function ConfigTab() {
  const { data: raffleData, isLoading } = trpc.raffle.getConfig.useQuery();
  const updateConfigMutation = trpc.raffle.updateConfig.useMutation();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: raffleData?.config || {},
  });

  useEffect(() => {
    if (raffleData?.config) {
      reset(raffleData.config as any);
    }
  }, [raffleData, reset]);

  const onSubmit = async (data: any) => {
    try {
      await updateConfigMutation.mutateAsync({
        raffleTitle: data.raffleTitle,
        raffleDescription: data.raffleDescription,
        numberPrice: data.numberPrice,
        drawDate: data.drawDate ? new Date(data.drawDate) : undefined,
        drawTime: data.drawTime,
      });
      toast.success("Configuración actualizada");
    } catch (error) {
      toast.error("Error al actualizar configuración");
    }
  };

  if (isLoading) {
    return <Loader2 className="w-8 h-8 animate-spin" />;
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle>Configuración de la Rifa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="raffleTitle">Título de la rifa</Label>
            <Input id="raffleTitle" {...register("raffleTitle")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="raffleDescription">Descripción</Label>
            <Input id="raffleDescription" {...register("raffleDescription")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberPrice">Precio por número</Label>
            <Input id="numberPrice" {...register("numberPrice")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="drawDate">Fecha del sorteo</Label>
            <Input id="drawDate" type="date" {...register("drawDate")} />
          </div>

          <Button type="submit" disabled={updateConfigMutation.isPending}>
            {updateConfigMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PrizesTab() {
  const { data: prizes, isLoading } = trpc.raffle.getPrizes.useQuery();
  const createPrizeMutation = trpc.raffle.createPrize.useMutation();
  const deletePrizeMutation = trpc.raffle.deletePrize.useMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      position: "",
      title: "",
      description: "",
      value: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await createPrizeMutation.mutateAsync({
        position: parseInt(data.position),
        title: data.title,
        description: data.description,
        value: data.value,
      });
      reset();
      toast.success("Premio creado");
    } catch (error) {
      toast.error("Error al crear premio");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePrizeMutation.mutateAsync({ id });
      toast.success("Premio eliminado");
    } catch (error) {
      toast.error("Error al eliminar premio");
    }
  };

  if (isLoading) {
    return <Loader2 className="w-8 h-8 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Crear nuevo premio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="position">Posición</Label>
              <Input id="position" type="number" {...register("position")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título del premio</Label>
              <Input id="title" {...register("title")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" {...register("description")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input id="value" {...register("value")} />
            </div>

            <Button type="submit" disabled={createPrizeMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Crear premio
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Prizes List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Premios existentes</h3>
        {prizes?.map((prize) => (
          <Card key={prize.id} className="card-elevated">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="font-semibold">{prize.position}º - {prize.title}</p>
                {prize.description && (
                  <p className="text-sm text-muted-foreground">{prize.description}</p>
                )}
                {prize.value && <p className="text-sm font-semibold text-accent">${prize.value}</p>}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(prize.id)}
                disabled={deletePrizeMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ParticipantsTab() {
  const { data: participants, isLoading } = trpc.raffle.getParticipants.useQuery();

  if (isLoading) {
    return <Loader2 className="w-8 h-8 animate-spin" />;
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle>Participantes registrados</CardTitle>
        <CardDescription>Total: {participants?.length || 0}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">Nombre</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Teléfono</th>
                <th className="text-left py-2 px-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {participants?.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-2 px-2">{p.firstName} {p.lastName}</td>
                  <td className="py-2 px-2">{p.email}</td>
                  <td className="py-2 px-2">{p.phone}</td>
                  <td className="py-2 px-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsTab() {
  const { data: transactions, isLoading } = trpc.raffle.getTransactions.useQuery();

  if (isLoading) {
    return <Loader2 className="w-8 h-8 animate-spin" />;
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle>Transacciones</CardTitle>
        <CardDescription>Total: {transactions?.length || 0}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">ID Transacción</th>
                <th className="text-left py-2 px-2">Monto</th>
                <th className="text-left py-2 px-2">Estado</th>
                <th className="text-left py-2 px-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-2 px-2 font-mono text-xs">{t.id}</td>
                  <td className="py-2 px-2">${t.amount} {t.currency}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      t.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2 px-2">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
