import * as core from '@actions/core';
import { runCortexSearch } from '@marcelinojackson-org/snowflake-common';

async function main(): Promise<void> {
  try {
    const serviceName = pickRequiredValue(
      core.getInput('service-name'),
      process.env.SEARCH_SERVICE,
      'Missing Cortex Search service name - provide `service-name` input or set SEARCH_SERVICE.'
    );

    const query = pickRequiredValue(
      core.getInput('query'),
      process.env.SEARCH_QUERY,
      'Missing Cortex Search query - provide `query` input or set SEARCH_QUERY.'
    );

    const limit = clampLimit(core.getInput('limit') || process.env.SEARCH_LIMIT);
    const filter = parseFilter(core.getInput('filter') || process.env.SEARCH_FILTER);
    const fields = parseFields(core.getInput('fields') || process.env.SEARCH_FIELDS);
    const offset = parseOptionalNumber(core.getInput('offset') || process.env.SEARCH_OFFSET);
    const includeScores = parseOptionalBoolean(core.getInput('include-scores') || process.env.SEARCH_INCLUDE_SCORES);
    const scoreThreshold = parseOptionalNumber(core.getInput('score-threshold') || process.env.SEARCH_SCORE_THRESHOLD);
    const reranker = (core.getInput('reranker') || process.env.SEARCH_RERANKER || '').trim() || undefined;
    const rankingProfile = (core.getInput('ranking-profile') || process.env.SEARCH_RANKING_PROFILE || '').trim() || undefined;

    const result = await runCortexSearch({
      serviceName,
      query,
      limit,
      filter,
      fields,
      offset,
      includeScores,
      scoreThreshold,
      reranker,
      rankingProfile
    });

    console.log('Cortex Search succeeded ✅');
    console.log(`Service: ${serviceName}`);
    console.log(`Limit: ${limit}`);
    if (fields?.length) {
      console.log(`Fields: ${fields.join(', ')}`);
    }
    const payload = {
      query,
      response: result.response
    };

    console.log('Response JSON:', JSON.stringify(payload, null, 2));
    core.setOutput('result-json', JSON.stringify(payload));
  } catch (error) {
    console.error('Cortex Search failed:');
    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
      core.setFailed(error.message);
    } else {
      console.error(error);
      core.setFailed('Unknown error when running Cortex Search');
    }
  }
}

function pickRequiredValue(primary: string, fallback: string | undefined, message: string): string {
  const candidate = (primary || fallback || '').trim();
  if (!candidate) {
    throw new Error(message);
  }
  return candidate;
}

function clampLimit(raw?: string): number {
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || raw === undefined || raw === '') {
    return 3;
  }
  if (parsed <= 0) {
    return 3;
  }
  return Math.max(1, Math.floor(parsed));
}

function parseFilter(raw?: string): Record<string, unknown> | undefined {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Filter JSON must describe an object.');
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Invalid filter JSON: ${(err as Error).message}`);
  }
}

function parseFields(raw?: string): string[] | undefined {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        throw new Error('SEARCH_FIELDS must be a JSON array or comma-separated list.');
      }
      return parsed.map((field) => String(field).trim()).filter((field) => field.length > 0);
    } catch (err) {
      throw new Error(`Invalid fields JSON: ${(err as Error).message}`);
    }
  }

  return trimmed.split(',').map((field) => field.trim()).filter((field) => field.length > 0);
}

function parseOptionalNumber(raw?: string): number | undefined {
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${raw}`);
  }
  return parsed;
}

function parseOptionalBoolean(raw?: string): boolean | undefined {
  if (!raw) {
    return undefined;
  }

  const normalized = raw.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }
  return undefined;
}

void main();
