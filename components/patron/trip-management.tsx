"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";

const TripManagement = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Dummy trip data for demonstration
  const trips = [
    {
      id: 1,
      date: "2024-01-20",
      origin: "City A",
      destination: "City B",
      status: "SCHEDULED",
    },
    {
      id: 2,
      date: "2024-01-22",
      origin: "City C",
      destination: "City D",
      status: "BOARDING",
    },
    {
      id: 3,
      date: "2024-01-25",
      origin: "City E",
      destination: "City F",
      status: "IN_TRANSIT",
    },
    {
      id: 4,
      date: "2024-01-28",
      origin: "City G",
      destination: "City H",
      status: "COMPLETED",
    },
    {
      id: 5,
      date: "2024-01-30",
      origin: "City I",
      destination: "City J",
      status: "CANCELLED",
    },
  ];

  const filteredTrips = trips.filter((trip) => {
    if (statusFilter !== "all" && trip.status !== statusFilter) {
      return false;
    }

    const today = new Date();
    const tripDate = new Date(trip.date);

    if (dateFilter === "today") {
      return tripDate.toDateString() === today.toDateString();
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      const endOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay() + 6)
      );
      return tripDate >= startOfWeek && tripDate <= endOfWeek;
    } else if (dateFilter === "month") {
      return (
        tripDate.getMonth() === today.getMonth() &&
        tripDate.getFullYear() === today.getFullYear()
      );
    }

    return true;
  });

  return (
    <Card>
      <CardHeader>
        <h2>Trip Management</h2>
      </CardHeader>
      <CardBody>
        <div className="flex gap-4 mb-4">
          <Select
            label="Filter by Status"
            placeholder="All Statuses"
            selectedKeys={[statusFilter]}
            onSelectionChange={(e) => setStatusFilter(e.currentKey || "all")}
          >
            <SelectItem value="SCHEDULED">Programmé</SelectItem>
            <SelectItem value="BOARDING">Embarquement</SelectItem>
            <SelectItem value="IN_TRANSIT">En route</SelectItem>
            <SelectItem value="COMPLETED">Terminé</SelectItem>
            <SelectItem value="CANCELLED">Annulé</SelectItem>
          </Select>

          <Select
            label="Filter by Date"
            placeholder="All Dates"
            selectedKeys={[dateFilter]}
            onSelectionChange={(e) => setDateFilter(e.currentKey || "all")}
          >
            <SelectItem value="all">Tous les voyages</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </Select>
        </div>

        <Table aria-label="Example table with custom cells">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>Date</TableColumn>
            <TableColumn>Origin</TableColumn>
            <TableColumn>Destination</TableColumn>
            <TableColumn>Status</TableColumn>
          </TableHeader>
          <TableBody items={filteredTrips}>
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.origin}</TableCell>
                <TableCell>{item.destination}</TableCell>
                <TableCell>{item.status}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default TripManagement;
