"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (item: any, index?: number) => React.ReactNode;
}

interface DataTableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Column<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions?: (item: any) => React.ReactNode;
  pageSize?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable({
  columns,
  data,
  searchPlaceholder = "Tìm kiếm...",
  onSearch,
  actions,
  pageSize = 10,
}: DataTableProps<any>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredData = onSearch
    ? data
    : data.filter((item) =>
        columns.some((col) => {
          const val = item[col.key];
          return val && String(val).toLowerCase().includes(search.toLowerCase());
        })
      );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    if (onSearch) onSearch(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th key={col.key} className="h-12 px-4 text-left font-medium text-muted-foreground">
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="h-12 px-4 text-right font-medium text-muted-foreground">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              pagedData.map((item, i) => (
                <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="p-4">
                      {col.render ? col.render(item, (page - 1) * pageSize + i) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && <td className="p-4 text-right">{actions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredData.length)} / {filteredData.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Trang {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
