import { createBlogInput, updateBlogInput } from '@nilesh_01/medium-common1';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono';
import { verify } from 'hono/jwt';

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
  },
  Variables: {
    userId: string
  }
}>();
blogRouter.use('/*', async(c, next) => {
  // extract the user id
  // pass the user id
  const authHeader =  c.req.header("authorization")|| "";
  const user = await verify(authHeader, "secret")
  console.log("authorid "+user.id)
  if(user){

    c.set("userId", user.id as string);
    await next();
  }
  else{
    return c.json({ message: 'not logged in' }, 401);
  }
});

blogRouter.post('/', async (c) => {
  const body = await c.req.json();
  const {success} = createBlogInput.safeParse(body);
      if(!success){
        c.status(411)
        return c.json({error:"Invalid input"})
      }
  const authorId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blog  = await prisma.post.create({
    data:
    {
      title: body.title,
      content: body.content,
      authorId: Number(authorId)
      },
  });
  return c.json({
    id: blog.id,
  });
});
blogRouter.put('/', async(c) => {
  const body = await c.req.json();
  const {success} = updateBlogInput.safeParse(body);
      if(!success){
        c.status(411)
        return c.json({error:"Invalid input"})
      }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blog  = await prisma.post.update({
    where: {
      id:body.id
    },
    data:
    {
      title: body.title,
      content: body.content,
      },
  });
  return c.json({
    id: blog.id,
  });
});
blogRouter.get('/bulk', async(c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blogs =await prisma.post.findMany();
  return c.json({blogs});
});


blogRouter.get('/:id', async (c) => {
  const id = c.req.param("id");
  console.log(`Fetching blog with ID: ${id}`); // Log the received ID

  const parsedId = Number(id);

  if (isNaN(parsedId)) {
    return c.json({ message: "Invalid ID format" }, 400); // Return error if the ID is not a valid number
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.post.findFirst({
      where: {
        id: parsedId
      }
    });

    if (!blog) {
      return c.json({ message: "Blog not found" }, 404); // Return error if no blog is found
    }

    console.log(blog); // Log the fetched blog data
    return c.json({ blog });

  } catch (e) {
    console.error(e); // Log the error for debugging
    c.status(500);
    return c.json({ message: "Error while fetching blog" });
  }
});

// Todo add pagination

