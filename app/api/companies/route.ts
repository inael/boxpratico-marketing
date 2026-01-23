import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Company, PersonType, CompanyRoles, BusinessCategory } from '@/types';
import { setEntity, getEntity, getAllEntities, deleteEntity } from '@/lib/redis';
import { requireAuth, AuthenticatedUser } from '@/lib/auth-utils';
import { geocodeAddressComponents, buildFullAddress, isGoogleMapsConfigured } from '@/lib/geocoding';

const COMPANIES_KEY = 'companies';

// Função para gerar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /api/companies - Listar empresas
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const searchParams = request.nextUrl.searchParams;

    // Filtros
    const role = searchParams.get('role'); // 'screen_location' | 'advertiser' | 'both' | null
    const accountId = searchParams.get('accountId');
    const isActive = searchParams.get('isActive');

    // Buscar todas as empresas
    let companies = await getAllEntities<Company>(COMPANIES_KEY);

    // Filtrar por conta (multi-tenant)
    if (currentUser.isAdmin && accountId) {
      companies = companies.filter((c) => c.accountId === accountId);
    } else if (!currentUser.isAdmin) {
      companies = companies.filter((c) => c.accountId === currentUser.accountId);
    }

    // Filtrar por papel
    if (role === 'screen_location') {
      companies = companies.filter((c) => c.roles?.isScreenLocation);
    } else if (role === 'advertiser') {
      companies = companies.filter((c) => c.roles?.isAdvertiser);
    } else if (role === 'both') {
      companies = companies.filter((c) => c.roles?.isScreenLocation && c.roles?.isAdvertiser);
    }

    // Filtrar por status ativo
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      companies = companies.filter((c) => c.isActive === activeFilter);
    }

    // Ordenar por nome
    companies.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 });
  }
}

// POST /api/companies - Criar nova empresa
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const body = await request.json();

    const {
      name,
      personType,
      document,
      roles,
      contactName,
      contactPhone,
      contactEmail,
      logoUrl,
      // Endereço
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      // Campos de ponto de tela
      category,
      blockedCategories,
      blockOwnCategory,
      averageDailyTraffic,
      pricing,
      commission,
      whatsappPhone,
      showNews,
      // Campos de anunciante
      segment,
      targetRadius,
      notes,
      // Metadados
      isActive = true,
      accountId: bodyAccountId,
    } = body;

    // Validações
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    if (!roles || (!roles.isScreenLocation && !roles.isAdvertiser)) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um papel: Ponto de Tela ou Anunciante' },
        { status: 400 }
      );
    }

    // Determinar accountId
    const accountId =
      currentUser.isAdmin && bodyAccountId ? bodyAccountId : currentUser.accountId;

    // Geocodificar endereço se tiver dados
    let latitude: number | undefined;
    let longitude: number | undefined;
    let geocodedAt: string | undefined;

    if (address && city && state) {
      const geocodeResult = await geocodeAddressComponents({
        address,
        addressNumber,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
      });

      if (geocodeResult.success) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
        geocodedAt = new Date().toISOString();
      }
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    const slug = generateSlug(name);

    const newCompany: Company = {
      id,
      name: name.trim(),
      slug,
      personType: (personType as PersonType) || 'company',
      document: document?.trim() || undefined,
      roles: roles as CompanyRoles,
      contactName: contactName?.trim() || undefined,
      contactPhone: contactPhone?.trim() || undefined,
      contactEmail: contactEmail?.trim() || undefined,
      logoUrl: logoUrl || undefined,
      // Endereço
      address: address?.trim() || undefined,
      addressNumber: addressNumber?.trim() || undefined,
      complement: complement?.trim() || undefined,
      neighborhood: neighborhood?.trim() || undefined,
      city: city?.trim() || undefined,
      state: state?.trim() || undefined,
      zipCode: zipCode?.trim() || undefined,
      // Geocodificação
      latitude,
      longitude,
      geocodedAt,
      geocodeSource: latitude ? 'google' : undefined,
      // Campos de ponto de tela
      category: category as BusinessCategory | undefined,
      blockedCategories: blockedCategories || undefined,
      blockOwnCategory: blockOwnCategory || undefined,
      averageDailyTraffic: averageDailyTraffic || undefined,
      pricing: pricing || undefined,
      commission: commission || undefined,
      whatsappPhone: whatsappPhone?.trim() || undefined,
      showNews: showNews ?? true,
      // Campos de anunciante
      segment: segment?.trim() || undefined,
      targetRadius: targetRadius || undefined,
      notes: notes?.trim() || undefined,
      // Metadados
      isActive,
      accountId,
      createdAt: now,
      updatedAt: now,
    };

    await setEntity(COMPANIES_KEY, id, newCompany);

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Failed to create company:', error);
    return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 });
  }
}

// PUT /api/companies - Atualizar empresa
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const existingCompany = await getEntity<Company>(COMPANIES_KEY, id);
    if (!existingCompany) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Verificar permissão
    if (!currentUser.isAdmin && existingCompany.accountId !== currentUser.accountId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Se endereço mudou, refazer geocodificação
    let latitude = existingCompany.latitude;
    let longitude = existingCompany.longitude;
    let geocodedAt = existingCompany.geocodedAt;

    const addressChanged =
      updates.address !== existingCompany.address ||
      updates.addressNumber !== existingCompany.addressNumber ||
      updates.city !== existingCompany.city ||
      updates.state !== existingCompany.state ||
      updates.zipCode !== existingCompany.zipCode;

    if (addressChanged && updates.address && updates.city && updates.state) {
      const geocodeResult = await geocodeAddressComponents({
        address: updates.address,
        addressNumber: updates.addressNumber,
        complement: updates.complement,
        neighborhood: updates.neighborhood,
        city: updates.city,
        state: updates.state,
        zipCode: updates.zipCode,
      });

      if (geocodeResult.success) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
        geocodedAt = new Date().toISOString();
      }
    }

    const updatedCompany: Company = {
      ...existingCompany,
      ...updates,
      latitude,
      longitude,
      geocodedAt,
      geocodeSource: latitude ? (existingCompany.geocodeSource || 'google') : undefined,
      updatedAt: new Date().toISOString(),
    };

    await setEntity(COMPANIES_KEY, id, updatedCompany);

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Failed to update company:', error);
    return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 });
  }
}

// DELETE /api/companies?id=xxx - Excluir empresa
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const existingCompany = await getEntity<Company>(COMPANIES_KEY, id);
    if (!existingCompany) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Verificar permissão
    if (!currentUser.isAdmin && existingCompany.accountId !== currentUser.accountId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    await deleteEntity(COMPANIES_KEY, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete company:', error);
    return NextResponse.json({ error: 'Erro ao excluir empresa' }, { status: 500 });
  }
}
