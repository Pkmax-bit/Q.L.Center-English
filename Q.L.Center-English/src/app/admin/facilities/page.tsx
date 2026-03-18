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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Facility } from "@/types";

interface FacilityForm {
  id?: string;
  name: string;
  type: string;
  capacity: string;
  equipment: string;
  status: string;
  address: string;
}

const emptyForm: FacilityForm = {
  name: "",
  type: "classroom",
  capacity: "",
  equipment: "",
  status: "available",
  address: "",
};

export default function AdminFacilitiesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FacilityForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchFacilities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/facilities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFacilities(data.data || []);
      }
    } catch {
      toast({ title: "Lỗi tải dữ liệu cơ sở", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (facility: Facility) => {
    setForm({
      id: facility.id,
      name: facility.name,
      type: facility.type,
      capacity: facility.capacity ? String(facility.capacity) : "",
      equipment: facility.equipment || "",
      status: facility.status,
      address: facility.address || "",
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast({ title: "Vui lòng nhập tên cơ sở", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: form.id }),
        name: form.name,
        type: form.type,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        equipment: form.equipment || null,
        status: form.status,
        address: form.address || null,
      };

      const res = await fetch("/api/admin/facilities", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý");

      toast({ title: editing ? "Cập nhật cơ sở thành công" : "Thêm cơ sở thành công" });
      setModalOpen(false);
      fetchFacilities();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cơ sở này?")) return;
    try {
      const res = await fetch(`/api/admin/facilities?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast({ title: "Xóa cơ sở thành công" });
      fetchFacilities();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    }
  };

  const typeLabels: Record<string, string> = {
    campus: "Khuôn viên",
    building: "Tòa nhà",
    classroom: "Phòng học",
    lab: "Phòng thí nghiệm",
    office: "Văn phòng",
  };

  const statusLabels: Record<string, string> = {
    available: "Sẵn sàng",
    occupied: "Đang sử dụng",
    maintenance: "Bảo trì",
  };

  const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
    available: "default",
    occupied: "secondary",
    maintenance: "outline",
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Facility, index?: number) => (index ?? 0) + 1,
    },
    { key: "name", label: "Tên" },
    {
      key: "type",
      label: "Loại",
      render: (item: Facility) => typeLabels[item.type] || item.type,
    },
    {
      key: "capacity",
      label: "Sức chứa",
      render: (item: Facility) => (item.capacity ? `${item.capacity} người` : "—"),
    },
    {
      key: "equipment",
      label: "Trang thiết bị",
      render: (item: Facility) => item.equipment || "—",
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: Facility) => (
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
          <h1 className="text-3xl font-bold">Quản lý cơ sở</h1>
          <p className="text-muted-foreground mt-1">Danh sách cơ sở vật chất của trung tâm</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm cơ sở
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={facilities}
        searchPlaceholder="Tìm kiếm cơ sở..."
        actions={(item: Facility) => (
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
        title={editing ? "Chỉnh sửa cơ sở" : "Thêm cơ sở mới"}
        description={editing ? "Cập nhật thông tin cơ sở" : "Nhập thông tin cơ sở mới"}
      >
        <div className="space-y-4 mt-4">
          <FormField
            label="Tên cơ sở"
            name="name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Nhập tên cơ sở"
            required
          />
          <FormField
            label="Loại"
            name="type"
            type="select"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={[
              { value: "campus", label: "Khuôn viên" },
              { value: "building", label: "Tòa nhà" },
              { value: "classroom", label: "Phòng học" },
              { value: "lab", label: "Phòng thí nghiệm" },
              { value: "office", label: "Văn phòng" },
            ]}
          />
          <FormField
            label="Sức chứa"
            name="capacity"
            type="number"
            value={form.capacity}
            onChange={(v) => setForm({ ...form, capacity: v })}
            placeholder="Nhập sức chứa"
          />
          <FormField
            label="Trang thiết bị"
            name="equipment"
            type="textarea"
            value={form.equipment}
            onChange={(v) => setForm({ ...form, equipment: v })}
            placeholder="Mô tả trang thiết bị"
          />
          <FormField
            label="Trạng thái"
            name="status"
            type="select"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[
              { value: "available", label: "Sẵn sàng" },
              { value: "occupied", label: "Đang sử dụng" },
              { value: "maintenance", label: "Bảo trì" },
            ]}
          />
          <FormField
            label="Địa chỉ"
            name="address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="Nhập địa chỉ"
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
