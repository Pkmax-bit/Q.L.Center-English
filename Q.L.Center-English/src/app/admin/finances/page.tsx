"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Finance } from "@/types";

interface FinanceForm {
  id?: string;
  type: string;
  category: string;
  amount: string;
  description: string;
  payment_date: string;
  payment_method: string;
  status: string;
}

const emptyForm: FinanceForm = {
  type: "income",
  category: "tuition",
  amount: "",
  description: "",
  payment_date: new Date().toISOString().split("T")[0],
  payment_method: "",
  status: "pending",
};

export default function AdminFinancesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FinanceForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchFinances = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/finances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFinances(data.data || []);
      }
    } catch {
      toast({ title: "Lỗi tải dữ liệu tài chính", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const totalIncome = finances
    .filter((f) => f.type === "income" && f.status === "completed")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpense = finances
    .filter((f) => f.type === "expense" && f.status === "completed")
    .reduce((sum, f) => sum + f.amount, 0);

  const profit = totalIncome - totalExpense;

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (finance: Finance) => {
    setForm({
      id: finance.id,
      type: finance.type,
      category: finance.category,
      amount: String(finance.amount),
      description: finance.description || "",
      payment_date: finance.payment_date,
      payment_method: finance.payment_method || "",
      status: finance.status,
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.payment_date) {
      toast({ title: "Vui lòng điền đầy đủ thông tin bắt buộc", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: form.id }),
        type: form.type,
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || null,
        payment_date: form.payment_date,
        payment_method: form.payment_method || null,
        status: form.status,
      };

      const res = await fetch("/api/admin/finances", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý");

      toast({ title: editing ? "Cập nhật giao dịch thành công" : "Thêm giao dịch thành công" });
      setModalOpen(false);
      fetchFinances();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
    try {
      const res = await fetch(`/api/admin/finances?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast({ title: "Xóa giao dịch thành công" });
      fetchFinances();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    }
  };

  const typeLabels: Record<string, string> = { income: "Thu", expense: "Chi" };
  const categoryLabels: Record<string, string> = {
    tuition: "Học phí",
    salary: "Lương",
    equipment: "Thiết bị",
    rent: "Thuê mặt bằng",
    utilities: "Tiện ích",
    other: "Khác",
  };
  const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    completed: "default",
    cancelled: "destructive",
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Finance, index?: number) => (index ?? 0) + 1,
    },
    {
      key: "type",
      label: "Loại",
      render: (item: Finance) => (
        <Badge variant={item.type === "income" ? "default" : "destructive"}>
          {typeLabels[item.type]}
        </Badge>
      ),
    },
    {
      key: "category",
      label: "Danh mục",
      render: (item: Finance) => categoryLabels[item.category] || item.category,
    },
    {
      key: "amount",
      label: "Số tiền",
      render: (item: Finance) => formatCurrency(item.amount),
    },
    {
      key: "payment_date",
      label: "Ngày",
      render: (item: Finance) =>
        new Date(item.payment_date).toLocaleDateString("vi-VN"),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: Finance) => (
        <Badge variant={statusVariants[item.status] || "secondary"}>
          {statusLabels[item.status] || item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý tài chính</h1>
          <p className="text-muted-foreground mt-1">Theo dõi thu chi của trung tâm</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm giao dịch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng thu</CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng chi</CardTitle>
            <div className="p-2 rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lợi nhuận</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={finances}
        searchPlaceholder="Tìm kiếm giao dịch..."
        actions={(item: Finance) => (
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}
        description={editing ? "Cập nhật thông tin giao dịch" : "Nhập thông tin giao dịch mới"}
      >
        <div className="space-y-4 mt-4">
          <FormField
            label="Loại"
            name="type"
            type="select"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={[
              { value: "income", label: "Thu" },
              { value: "expense", label: "Chi" },
            ]}
            required
          />
          <FormField
            label="Danh mục"
            name="category"
            type="select"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            options={[
              { value: "tuition", label: "Học phí" },
              { value: "salary", label: "Lương" },
              { value: "equipment", label: "Thiết bị" },
              { value: "rent", label: "Thuê mặt bằng" },
              { value: "utilities", label: "Tiện ích" },
              { value: "other", label: "Khác" },
            ]}
            required
          />
          <FormField
            label="Số tiền"
            name="amount"
            type="number"
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: v })}
            placeholder="Nhập số tiền"
            required
          />
          <FormField
            label="Mô tả"
            name="description"
            type="textarea"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Nhập mô tả giao dịch"
          />
          <FormField
            label="Ngày thanh toán"
            name="payment_date"
            type="date"
            value={form.payment_date}
            onChange={(v) => setForm({ ...form, payment_date: v })}
            required
          />
          <FormField
            label="Phương thức thanh toán"
            name="payment_method"
            value={form.payment_method}
            onChange={(v) => setForm({ ...form, payment_method: v })}
            placeholder="VD: Tiền mặt, Chuyển khoản"
          />
          <FormField
            label="Trạng thái"
            name="status"
            type="select"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[
              { value: "pending", label: "Chờ xử lý" },
              { value: "completed", label: "Hoàn thành" },
              { value: "cancelled", label: "Đã hủy" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang xử lý..." : editing ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
