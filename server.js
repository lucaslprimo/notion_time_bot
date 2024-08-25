require('dotenv').config();
const { Client } = require('@notionhq/client');

// Inicializa o cliente do Notion
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Função para duplicar a última linha
async function duplicateLastRow(line) {

  try {

    if (!line) {
      console.log('Nenhuma linha encontrada no banco de dados.');
      return;
    }

    // Cria uma nova página com as propriedades da última linha
    const newPage = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: formatProperties(line.properties),
    });

    const pageId = line.id;

    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Inicio': {
          date: null
        },
      },
    });

    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Fim': {
          date: null
        },
      },
    });

    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Status tempo': {
          status: {
            name: "Pausado",
          },
        },
      },
    });

    console.log('Linha duplicada com sucesso!', newPage);
  } catch (error) {
    console.error('Erro ao duplicar a linha:', error);
  }
}

// Função para formatar as propriedades
function formatProperties(properties) {
  const formattedProperties = {};

  for (const key in properties) {
    const property = properties[key];

    if (property.type === 'title' || property.type === 'rich_text') {
      formattedProperties[key] = property;
    } else if (property.type === 'number') {
      formattedProperties[key] = {
        type: 'number',
        number: property.number
      };
    } else if (property.type === 'select') {
      formattedProperties[key] = {
        type: 'select',
        select: property.select
      };
    } else if (property.type === 'multi_select') {
      formattedProperties[key] = {
        type: 'multi_select',
        multi_select: property.multi_select
      };
    } else if (property.type === 'date') {
      formattedProperties[key] = {
        type: 'date',
        date: property.date
      };
    } else if (property.type === 'checkbox') {
      formattedProperties[key] = {
        type: 'checkbox',
        checkbox: property.checkbox
      };
    } else if (property.type === 'url') {
      formattedProperties[key] = {
        type: 'url',
        url: property.url
      };
    } else if (property.type === 'email') {
      formattedProperties[key] = {
        type: 'email',
        email: property.email
      };
    } else if (property.type === 'phone_number') {
      formattedProperties[key] = {
        type: 'phone_number',
        phone_number: property.phone_number
      };
    } else if (property.type === 'people') {
      formattedProperties[key] = {
        type: 'people',
        people: property.people
      };
    } else if (property.type === 'files') {
      formattedProperties[key] = {
        type: 'files',
        files: property.files
      };
    } else if (property.type === 'relation') {
      formattedProperties[key] = {
        type: 'relation',
        relation: property.relation
      };
    } else if (property.type === 'status') {
      formattedProperties[key] = {
        type: 'status',
        status: property.status
      };
    } else if (property.type === 'rollup') {
      // Propriedades rollup não podem ser copiadas diretamente
      continue;
    } else {
      // Ignorar tipos de propriedades desconhecidos
      continue;
    }
  }

  return formattedProperties;
}

// Função para atualizar o campo "Início" se o status for "iniciado"
async function updateInicioIfStarted(line) {
  try {

    if (!line) {
      console.log('Nenhuma linha encontrada no banco de dados.');
      return;
    }

    const statusTempo = line.properties['Status tempo'].status?.name;
    
    if (statusTempo === 'Iniciado') {
      const newInicioDate = new Date().toISOString(); // Data atual no formato ISO
      const pageId = line.id;

      await notion.pages.update({
        page_id: pageId,
        properties: {
          'Inicio': {
            date: {
              start: newInicioDate,
            },
          },
        },
      });

      console.log('Campo "Início" atualizado com sucesso!');
    } else {
      console.log('O status não é "Iniciado", nenhuma atualização foi feita.');
    }
  } catch (error) {
    console.error('Erro ao verificar ou atualizar a linha:', error);
  }
}

async function updateFimIfFinished(line) {
  try {
 
    if (!line) {
      console.log('Nenhuma linha encontrada no banco de dados.');
      return;
    }

    const statusTempo = line.properties['Status tempo'].status?.name;
    
    if (statusTempo === 'Finalizado') {
      const newInicioDate = new Date().toISOString(); // Data atual no formato ISO
      const pageId = line.id;

      await notion.pages.update({
        page_id: pageId,
        properties: {
          'Fim': {
            date: {
              start: newInicioDate,
            },
          },
        },
      });

      console.log('Campo "Finalizado" atualizado com sucesso!');
    } else {
      console.log('O status não é "Finalizado", nenhuma atualização foi feita.');
    }
  } catch (error) {
    console.error('Erro ao verificar ou atualizar a linha:', error);
  }
}

async function updateAndDuplicateIfPaused(line) {
  const databaseId = process.env.DATABASE_ID;

  try {


    if (!line) {
      console.log('Nenhuma linha encontrada no banco de dados.');
      return;
    }

    const statusTempo = line.properties['Status tempo'].status?.name;
    
    if (statusTempo === 'Pausado') {
      const newInicioDate = new Date().toISOString(); // Data atual no formato ISO
      const pageId = line.id;

      await notion.pages.update({
        page_id: pageId,
        properties: {
          'Fim': {
            date: {
              start: newInicioDate,
            },
          },
        },
      });

      await notion.pages.update({
        page_id: pageId,
        properties: {
          'Status tempo': {
            status: {
              name: "Finalizado",
            },
          },
        },
      });

      duplicateLastRow();

      console.log('Campo "Finalizado" atualizado com sucesso!');
    } else {
      console.log('O status não é "Finalizado", nenhuma atualização foi feita.');
    }
  } catch (error) {
    console.error('Erro ao verificar ou atualizar a linha:', error);
  }
}

async function getPageById(pageId) {
  try {
    // Faz a chamada para buscar a página com o ID especificado
    const response = await notion.pages.retrieve({ page_id: pageId });

    // Retorna os dados da página
    return response;
  } catch (error) {
    console.error('Erro ao buscar a página:', error.message);
  }
}

async function checkLine(lineId){

  try{
    const line = await getPageById(lineId);

    console.log("Linha do notion:", line);

    updateInicioIfStarted(line);
    updateFimIfFinished(line);
    updateAndDuplicateIfPaused(line);
  }catch (error) {
    console.error('Erro ao buscar a linha:', error.message);
  }

}


//Server settings
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Configura o body-parser para processar JSON
app.use(bodyParser.json());

// Rota para receber o webhook
app.post('/webhook', (req, res) => {
    const data = req.body;

    // Aqui você pode processar a data recebida
    console.log('Webhook data received:', data);

    // Envia uma resposta para o webhook
    res.status(200).send('Webhook received successfully');

    const pageId = data.id;
    checkLine(pageId);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});


