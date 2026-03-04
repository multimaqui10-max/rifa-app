import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const participantSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/checkout/:id");
  const raffleNumberId = params?.id ? parseInt(params.id) : null;
  const [sessionId] = useState(() => localStorage.getItem("sessionId") || "");
  const [step, setStep] = useState<"info" | "confirmation">("info");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
  });

  const { data: raffleData } = trpc.raffle.getConfig.useQuery();
  const { data: raffleNumber } = trpc.raffle.getNumbers.useQuery({});
  const createParticipantMutation = trpc.raffle.createParticipant.useMutation();
  const completeTransactionMutation = trpc.raffle.completeTransaction.useMutation();

  const currentNumber = raffleNumber?.find((n) => n.id === raffleNumberId);
  const config = raffleData?.config;
  const price = config?.numberPrice || "0";

  if (!raffleNumberId || !currentNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Número no encontrado</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ParticipantFormData) => {
    try {
      // Create participant
      const participantResult = await createParticipantMutation.mutateAsync({
        ...data,
        raffleNumberId,
        sessionId,
      });

      if (participantResult.success && participantResult.participant) {
        // Si hay link de Mercado Pago, redirigir
        if (config?.mercadoPagoLink) {
          // Guardar datos en localStorage para después del pago
          localStorage.setItem('pendingTransaction', JSON.stringify({
            participantId: (participantResult.participant as any).id,
            raffleNumberId,
            sessionId,
            amount: price,
            currency: "USD",
          }));
          // Redirigir a Mercado Pago
          window.open(config.mercadoPagoLink, '_blank');
          toast.success("Se abrió Mercado Pago. Completa el pago para confirmar tu compra.");
        } else {
          // Sin Mercado Pago, marcar como completado
          await completeTransactionMutation.mutateAsync({
            participantId: (participantResult.participant as any).id,
            raffleNumberId,
            sessionId,
            amount: price,
            currency: "USD",
          });
          setStep("confirmation");
          toast.success("¡Compra completada exitosamente!");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la compra");
    }
  };

  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">¡Compra Exitosa!</CardTitle>
            <CardDescription>Tu número ha sido registrado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Número comprado</p>
              <p className="text-4xl font-bold text-accent">{currentNumber.number}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Monto pagado:</strong> ${price}</p>
              <p><strong>Fecha del sorteo:</strong> {config?.drawDate ? new Date(config.drawDate).toLocaleDateString() : "Por definir"}</p>
            </div>
            <Button onClick={() => navigate("/")} className="w-full">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="container max-w-2xl">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Información del participante</CardTitle>
              <CardDescription>Completa tus datos para finalizar la compra</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    {...register("firstName")}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    placeholder="Pérez"
                    {...register("lastName")}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@example.com"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+598 99 123 456"
                    {...register("phone")}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || createParticipantMutation.isPending}
                >
                  {isSubmitting || createParticipantMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : config?.mercadoPagoLink ? (
                    "Ir a pagar con Mercado Pago"
                  ) : (
                    "Completar compra"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="space-y-4">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Resumen de compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-accent/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Número seleccionado</p>
                  <p className="text-5xl font-bold text-accent">{currentNumber.number}</p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio unitario</span>
                    <span className="font-semibold">${price}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-accent">${price}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  <p className="font-semibold mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tu número será reservado por 15 minutos</li>
                    <li>Debes completar el pago para confirmar la compra</li>
                    <li>Recibirás un email de confirmación</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
