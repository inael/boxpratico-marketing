import { NextRequest, NextResponse } from 'next/server';
import {
  Company,
  Condominium,
  Advertiser,
  condominiumToCompany,
  advertiserToCompany,
} from '@/types';
import {
  setEntity,
  getAllEntities,
} from '@/lib/redis';
import { requireAuth, AuthenticatedUser } from '@/lib/auth-utils';

const COMPANIES_KEY = 'companies';
const CONDOMINIUMS_KEY = 'condominiums';
const ADVERTISERS_KEY = 'advertisers';

// POST /api/companies/migrate - Migrar dados de Condominium e Advertiser para Company
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;

    // Apenas admin pode executar migração
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem executar migrações' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dryRun = true } = body; // Por padrão, apenas simula

    // Carregar dados existentes
    const existingCompanies = await getAllEntities<Company>(COMPANIES_KEY);
    const existingCompanyIds = new Set(existingCompanies.map(c => c.id));

    const condominiums = await getAllEntities<Condominium>(CONDOMINIUMS_KEY);
    const advertisers = await getAllEntities<Advertiser>(ADVERTISERS_KEY);

    const results = {
      dryRun,
      condominiums: {
        total: condominiums.length,
        migrated: 0,
        skipped: 0,
        errors: [] as string[],
      },
      advertisers: {
        total: advertisers.length,
        migrated: 0,
        skipped: 0,
        merged: 0,
        errors: [] as string[],
      },
      newCompanies: [] as Company[],
    };

    // Migrar Condominiums
    for (const condo of condominiums) {
      try {
        // Verificar se já existe uma company com esse ID
        if (existingCompanyIds.has(condo.id)) {
          results.condominiums.skipped++;
          continue;
        }

        const company = condominiumToCompany(condo);

        if (!dryRun) {
          await setEntity(COMPANIES_KEY, company.id, company);
        }

        results.newCompanies.push(company);
        results.condominiums.migrated++;
        existingCompanyIds.add(company.id);
      } catch (error) {
        results.condominiums.errors.push(
          `Erro ao migrar local ${condo.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    }

    // Migrar Advertisers
    for (const adv of advertisers) {
      try {
        // Verificar se já existe uma company com esse ID
        if (existingCompanyIds.has(adv.id)) {
          results.advertisers.skipped++;
          continue;
        }

        // Verificar se existe uma company com o mesmo CNPJ (para mesclar)
        const existingByDocument = results.newCompanies.find(
          c => c.document && c.document === adv.cnpj
        );

        if (existingByDocument) {
          // Mesclar: adicionar papel de anunciante à company existente
          existingByDocument.roles.isAdvertiser = true;
          existingByDocument.segment = adv.segment;
          existingByDocument.targetRadius = adv.targetRadius;
          existingByDocument.notes = adv.notes;
          existingByDocument.contactName = existingByDocument.contactName || adv.contactName;
          existingByDocument.contactPhone = existingByDocument.contactPhone || adv.contactPhone;
          existingByDocument.contactEmail = existingByDocument.contactEmail || adv.contactEmail;

          if (!dryRun) {
            await setEntity(COMPANIES_KEY, existingByDocument.id, existingByDocument);
          }

          results.advertisers.merged++;
          continue;
        }

        const company = advertiserToCompany(adv);

        if (!dryRun) {
          await setEntity(COMPANIES_KEY, company.id, company);
        }

        results.newCompanies.push(company);
        results.advertisers.migrated++;
        existingCompanyIds.add(company.id);
      } catch (error) {
        results.advertisers.errors.push(
          `Erro ao migrar anunciante ${adv.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? 'Simulação de migração concluída. Use dryRun: false para executar.'
        : 'Migração concluída com sucesso.',
      results: {
        dryRun: results.dryRun,
        condominiums: {
          total: results.condominiums.total,
          migrated: results.condominiums.migrated,
          skipped: results.condominiums.skipped,
          errors: results.condominiums.errors,
        },
        advertisers: {
          total: results.advertisers.total,
          migrated: results.advertisers.migrated,
          skipped: results.advertisers.skipped,
          merged: results.advertisers.merged,
          errors: results.advertisers.errors,
        },
        totalNewCompanies: results.newCompanies.length,
      },
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Erro ao executar migração' },
      { status: 500 }
    );
  }
}

// GET /api/companies/migrate - Verificar status da migração
export async function GET() {
  try {
    const condominiums = await getAllEntities<Condominium>(CONDOMINIUMS_KEY);
    const advertisers = await getAllEntities<Advertiser>(ADVERTISERS_KEY);
    const companies = await getAllEntities<Company>(COMPANIES_KEY);

    const screenLocations = companies.filter(c => c.roles?.isScreenLocation).length;
    const advertiserCompanies = companies.filter(c => c.roles?.isAdvertiser).length;
    const bothRoles = companies.filter(c => c.roles?.isScreenLocation && c.roles?.isAdvertiser).length;

    return NextResponse.json({
      legacy: {
        condominiums: condominiums.length,
        advertisers: advertisers.length,
      },
      companies: {
        total: companies.length,
        screenLocations,
        advertisers: advertiserCompanies,
        bothRoles,
      },
      migrationNeeded: condominiums.length > 0 || advertisers.length > 0,
    });
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status da migração' },
      { status: 500 }
    );
  }
}
