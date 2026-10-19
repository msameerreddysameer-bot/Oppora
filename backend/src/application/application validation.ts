import { application } from "express";
import {z} from "zod";

export const createApplicationSchema = z.object(
    {
        status:z.enum(['applied' , 'under-review' , 'interviewing' , 'offered' , 'accepted' , 'rejected' , 'withdrawn' ] as const).default("applied"),
        

    }
)

export const updateApplicationSchema = z.object(
    {
        status:z.enum(['applied' , 'under-review' , 'interviewing' , 'offered' , 'accepted' , 'rejected' , 'withdrawn' ] as const).default("applied"),
       
    }

)
export const  getUserApplicationsAndsearchAndfiltersSchema= z.object({
  queryTerm:z.string().optional(),
  page:z.coerce.number().default(1).optional(),
  limit:z.coerce.number().default(10).optional(),
  organizationType:z.preprocess((val) => (Array.isArray(val)?val:val?[val]:undefined),z.array(z.enum([
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
    status:z.enum(['applied' , 'under-review' , 'interviewing' , 'offered' , 'accepted' , 'rejected' , 'withdrawn' ] as const).optional()
  //sourceStatus:z.enum(["live","expired"]).optional(),
 // educationLevel:z.enum(['high-school' , 'diploma' , 'undergraduate' , 'postgraduate' , 'phd'] as const).default("undergraduate")
    



    

})


