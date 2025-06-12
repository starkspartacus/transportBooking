import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params: { id: employeeId } }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        status: true,
        nationality: true,
        department: true,
        position: true,
        salary: true,
        hireDate: true,
        country: true,
        city: true,
        commune: true,
        createdAt: true,
        updatedAt: true, // Added updatedAt
        lastLogin: true,
        companyId: true,
        image: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        idNumber: true,
        idType: true,
        idExpiryDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        emergencyRelation: true,
        employeeNotes: true,
        education: true,
        skills: true,
        languages: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId || "",
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    } else if (
      session.user.role === "GESTIONNAIRE" &&
      session.user.companyId !== employee.companyId
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params: { id: employeeId } }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "PATRON", "GESTIONNAIRE"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    // Vérifier que l'employé existe
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId || "",
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    } else if (
      session.user.role === "GESTIONNAIRE" &&
      session.user.companyId !== employee.companyId
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Traiter les données de mise à jour
    const {
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      role,
      status,
      nationality,
      department,
      position,
      salary,
      hireDate,
      image,
      address,
      country,
      city,
      commune,
      dateOfBirth,
      gender,
      idNumber,
      idType,
      idExpiryDate,
      education,
      skills,
      languages,
      bankName,
      bankAccountNumber,
      bankAccountName,
      emergencyContact,
      emergencyPhone,
      emergencyRelation,
      employeeNotes,
    } = body;

    // Préparer les données pour la mise à jour
    const updateData: any = {};

    // Informations de base
    if (firstName !== undefined && lastName !== undefined) {
      updateData.name = `${firstName} ${lastName}`;
      updateData.firstName = firstName;
      updateData.lastName = lastName;
    } else if (firstName !== undefined) {
      updateData.firstName = firstName;
      updateData.name = `${firstName} ${employee.lastName || ""}`.trim();
    } else if (lastName !== undefined) {
      updateData.lastName = lastName;
      updateData.name = `${employee.firstName || ""} ${lastName}`.trim();
    }

    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (countryCode !== undefined) updateData.countryCode = countryCode || null;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (nationality !== undefined) updateData.nationality = nationality || null;
    if (department !== undefined)
      updateData.department = department === "none" ? null : department;
    if (position !== undefined) updateData.position = position || null;
    if (salary !== undefined)
      updateData.salary =
        salary === ""
          ? null
          : salary
          ? Number.parseFloat(salary.toString())
          : null; // Handle empty string for salary
    if (hireDate !== undefined)
      updateData.hireDate =
        hireDate === "" ? null : hireDate ? new Date(hireDate) : null; // Handle empty string for date

    // Informations personnelles
    if (image !== undefined) updateData.image = image || null;
    if (address !== undefined) updateData.address = address || null;
    if (country !== undefined) updateData.country = country || null;
    if (city !== undefined) updateData.city = city || null;
    if (commune !== undefined) updateData.commune = commune || null;
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth =
        dateOfBirth === "" ? null : dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (idNumber !== undefined) updateData.idNumber = idNumber || null;
    if (idType !== undefined) updateData.idType = idType || null;
    if (idExpiryDate !== undefined)
      updateData.idExpiryDate =
        idExpiryDate === ""
          ? null
          : idExpiryDate
          ? new Date(idExpiryDate)
          : null;

    // Informations professionnelles
    if (education !== undefined) updateData.education = education || null;
    if (skills !== undefined)
      updateData.skills = Array.isArray(skills) ? skills : [];
    if (languages !== undefined)
      updateData.languages = Array.isArray(languages) ? languages : [];

    // Informations bancaires
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (bankAccountNumber !== undefined)
      updateData.bankAccountNumber = bankAccountNumber || null;
    if (bankAccountName !== undefined)
      updateData.bankAccountName = bankAccountName || null;

    // Contact d'urgence
    if (emergencyContact !== undefined)
      updateData.emergencyContact = emergencyContact || null;
    if (emergencyPhone !== undefined)
      updateData.emergencyPhone = emergencyPhone || null;
    if (emergencyRelation !== undefined)
      updateData.emergencyRelation = emergencyRelation || null;

    // Notes
    if (employeeNotes !== undefined)
      updateData.employeeNotes = employeeNotes || null;

    // Ajouter la date de mise à jour
    updateData.updatedAt = new Date();

    // Mettre à jour l'employé
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: updateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        status: true,
        nationality: true,
        department: true,
        position: true,
        salary: true,
        hireDate: true,
        country: true,
        city: true,
        commune: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        image: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        idNumber: true,
        idType: true,
        idExpiryDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        emergencyRelation: true,
        employeeNotes: true,
        education: true,
        skills: true,
        languages: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_UPDATED",
        description: `Employé mis à jour: ${updatedEmployee.name} (${updatedEmployee.role})`,
        userId: session.user.id,
        companyId: employee.companyId || undefined,
        metadata: {
          employeeId: updatedEmployee.id,
          employeeName: updatedEmployee.name,
          employeeRole: updatedEmployee.role,
        },
      },
    });

    return NextResponse.json({
      message: "Employé mis à jour avec succès",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: { id: employeeId } }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "PATRON"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'employé existe
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: { in: ["GESTIONNAIRE", "CAISSIER"] },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (session.user.role === "PATRON") {
      const company = await prisma.company.findFirst({
        where: {
          id: employee.companyId || "",
          ownerId: session.user.id,
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    // Enregistrer l'activité avant de supprimer l'employé
    await prisma.activity.create({
      data: {
        type: "EMPLOYEE_DELETED",
        description: `Employé supprimé: ${employee.name} (${employee.role})`,
        userId: session.user.id,
        companyId: employee.companyId || undefined,
        metadata: {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeRole: employee.role,
        },
      },
    });

    // Supprimer l'employé
    await prisma.user.delete({
      where: { id: employeeId },
    });

    return NextResponse.json({ message: "Employé supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
