import { QueryTranslator } from "@js-soft/docdb-querytranslator";
import config from "config";
import express from "express";
import { arbitraryModel } from "./arbitraryDataModel";

export class PrivateRoutes {
  public static async writeInDb(req: express.Request, res: express.Response): Promise<any> {
    if (!config.get("server.enableGenericDbAccess")) return res.sendStatus(400);
    if (!req.body.payload) return res.sendStatus(400);

    const data = new arbitraryModel({
      payload: req.body.payload
    });

    await data.save();
    return res.sendStatus(201);
  }

  public static async readFromDb(req: express.Request, res: express.Response): Promise<any> {
    if (!config.get("server.enableGenericDbAccess")) return res.sendStatus(400);

    Object.keys(req.query).forEach((key) => {
      req.query[`payload.${key}`] = req.query[key];
      delete req.query[key];
    });
    const queryTranslator = new QueryTranslator();
    const filter = queryTranslator.parse(req.query);
    const result = await arbitraryModel.find(filter);

    return res.send(result);
  }

  public static async deleteFromDb(req: express.Request, res: express.Response): Promise<any> {
    if (!config.get("server.enableGenericDbAccess")) return res.sendStatus(400);

    Object.keys(req.query).forEach((key) => {
      req.query[`payload.${key}`] = req.query[key];
      delete req.query[key];
    });
    const queryTranslator = new QueryTranslator();
    const filter = queryTranslator.parse(req.query);
    const result = await arbitraryModel.deleteMany(filter);
    return res.send(result);
  }

  public static async updateDb(req: express.Request, res: express.Response): Promise<any> {
    if (!config.get("server.enableGenericDbAccess")) return res.sendStatus(400);
    if (!req.body.filter || !req.body.data) return res.sendStatus(400);

    Object.keys(req.body.filter).forEach((key) => {
      req.body.filter[`payload.${key}`] = req.body.filter[key];
      delete req.body.filter[key];
    });
    Object.keys(req.body.data).forEach((key) => {
      req.body.data[`payload.${key}`] = req.body.data[key];
      delete req.body.data[key];
    });
    const result = await arbitraryModel.updateMany(req.body.filter, req.body.data);
    return res.send(result);
  }
}
