import {z} from "zod"

export const searchSavedOpportunitySchema = z.object({
  queryTerm:z.string().optional(),
  page:z.coerce.number().default(1).optional(),
  limit:z.coerce.number().default(10).optional(),
  organizationType:z.preprocess((val) => (Array.isArray(val)?val:val?[val]:undefined),
  z.array(z.enum([
        "government",
        "private",
        "university",
        "ngo",
        "start-up",
        "non-profit",
        "international-organisation",
      ]
    )
  )
).optional(),

  category:z.enum([
        "Scholarship",
        "intership",
        "hackathon",
        "competition",
        "fellowship",
        "research",
        "open-source",
        "workshop",
      ]).optional(),
  sourceStatus:z.enum(["live","expired"]).optional(),

    })
