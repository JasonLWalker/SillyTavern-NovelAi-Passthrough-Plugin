import express, { Router } from 'express';
import { Chalk } from 'chalk';

const fetch = require('node-fetch').default;
//const express = require('express')

const jsonParser =  express.json({ limit: '200mb' });

const API_NOVELAI = 'https://api.novelai.net';
const IMAGE_NOVELAI = 'https://image.novelai.net';

interface PluginInfo {
    id: string;
    name: string;
    description: string;
}

interface Plugin {
    init: (router: Router) => Promise<void>;
    exit: () => Promise<void>;
    info: PluginInfo;
}

const chalk = new Chalk();
const MODULE_NAME = '[novelai-passthrough]';

/**
 * Initialize the plugin.
 * @param router Express Router
 */
export async function init(router: Router): Promise<void> {
    
    // Used to check if the server plugin is running
    router.get('/*', jsonParser, async (req, res) => {
        try {
            var body;
            var headers;

            if (req.headers['Authorization'] || req.headers['authorization'])
                headers = {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['Authorization'] || req.headers['authorization']
                };
            else
                headers = {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                };

            var s = JSON.stringify(req.body);
            if (s !== '{}')
                body = s;

            const response = await fetch(API_NOVELAI + req.url, {
                method: 'GET',
                body: body,
                headers: headers,
            });
    
            var data;
            if (response.headers.get('content-type') == 'application/json')
                data = await response.json();
            else
                data = await response.text();

            return res.status(response.status).setHeader('content-type', response.headers.get('content-type')).send(data);
        } catch (error) {
            console.log(error);
            return res.send({ error: true });
        }        
    });

    router.post('/*', jsonParser, async (req, res) => {
        try {
            var headers;
            var body = JSON.stringify(req.body);

            if (req.headers['_Authorization'] || req.headers['_authorization'])
                headers = {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['_Authorization'] || req.headers['_authorization']
                };
            else
                headers = {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                };

            if (body === '{}')
                body = '';

            const response = await fetch(API_NOVELAI + req.url, {
                method: 'POST',
                body: body,
                headers: headers,
            });

            var data;
            if (response.headers.get('content-type') == 'application/json')
                data = await response.json();
            else
                data = await response.text();

            return res.status(response.status).setHeader('content-type', response.headers.get('content-type')).send(data);
        } catch (error) {
            console.log(error);
            return res.send({ error: true });
        }        
    });

    console.log(chalk.green(MODULE_NAME), 'Plugin loaded!');
}

export async function exit(): Promise<void> {
    //console.log(chalk.yellow(MODULE_NAME), 'Plugin exited');
}

export const info: PluginInfo = {
    id: 'novelai-passthrough',
    name: 'NovelAI Passthrough Plugin',
    description: 'A simple plugin for SillyTavern servers that are not running over SSL to still access the extended NovelAI api via HTTPS.',
};

const plugin: Plugin = {
    init,
    exit,
    info,
};

export default plugin;
