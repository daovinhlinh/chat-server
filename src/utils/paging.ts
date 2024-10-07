import { Document, Model } from 'mongoose'

interface PaginateOptions {
  page: number
  limit: number
}

interface PaginateResult<T> {
  docs: T[]
  page: number
  totalPages: number
}

export const paginate = async <T>(
  model: Model<T>,
  query: any,
  options: PaginateOptions
): Promise<PaginateResult<T>> => {
  const { page, limit } = options
  const skip = (page - 1) * limit

  const [docs, total] = await Promise.all([
    model.find(query).skip(skip).limit(limit),
    model.countDocuments(query)
  ])

  const totalPages = Math.ceil(total / limit)

  return { docs, page: Number(page), totalPages }
}
