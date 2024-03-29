import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnections } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccestoken, createRefreshToken } from "./auth";

(async () => {
  const app = express();

  app.use(cookieParser());
  app.listen(4000, () => {
    console.log("running at port 4000");
  });
  app.get("/", (_req, res) => {
    res.send("cool it works!");
  });
  app.post("/refresh_token", async (req, res) => {
    const token = req.cookies.jid;

    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: "" });
    }

    const user = await User.findOne({ id: payload.userId });

    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    res.cookie("jid", createRefreshToken(user), { httpOnly: true });

    return res.send({ ok: true, accessToken: createAccestoken(user) });

    // console.log(req.cookies);
  });

  await createConnections();
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver]
    }),
    context: ({ req, res }) => ({ req, res })

    // typeDefs: `
    //   type Query{
    //       hello: String!
    //   }`,
    // resolvers: {
    //   Query: {
    //     hello: () => "hello world"
    //   }
    // }
  });

  apolloServer.applyMiddleware({ app });
})();

// import { User } from "./entity/User";

// createConnection()
//   .then(async connection => {
//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await connection.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);

//     console.log("Loading users from the database...");
//     const users = await connection.manager.find(User);
//     console.log("Loaded users: ", users);

//     console.log("Here you can setup and run express/koa/any other framework.");
//   })
//   .catch(error => console.log(error));
