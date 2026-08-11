![introdução](./assets/Intro.png)


# Apache Flume e Kafka

## 🚀 1 - Introdução 

Este relatório descreve o processo de configuração e teste de um sistema utilizando Apache Kafka e Apache Flume em um ambiente de máquina virtual. O objetivo principal é criar tópicos no Kafka, produzir e consumir mensagens, e utilizar agentes do Flume para ingerir dados de um diretório de spool para um tópico do Kafka.

## ⚙️ 2 - Hardware e aplicativos utilizados

Vamos utilizar uma Maquina virtual no Virtualbox configurada com o Apache Flume e Kafka.
A maquina virtual tem as seguintes configurações.

![Configurações da maquina virtual](./assets/image.png)

![Maquina virtual](./assets/image_2.png)
                            
## 📖 3 - Requisitos do Projeto 

Objetivos
1.	Configurar e iniciar um servidor Kafka.
2.	Criar tópicos no Kafka.
3.	Produzir e consumir mensagens utilizando scripts do Kafka.
4.	Configurar e executar agentes do Flume para integrar com Kafka.
5.	Validar a ingestão e consumo de dados entre Flume e Kafka.

## 📝4 - Procedimentos e resultados

### Configurando o servidor
Para configurar nosso servidor, vamos utilizar o seguinte comando no terminal:

```
sudo /home/puc/kafka_2.11-1.0.0/bin/kafka-server-start.sh /home/puc/kafka_2.11-1.0.0/config/server.properties
```
![...](./assets/subindo_servidor.png)

Obs.: É necessário manter esse terminal aberto durante a utilização do servidor.

### Criando o primeiro tópico
Para criar nosso topico, vamos abrir um novo terminal e executar o seguinte comando:

```
sudo /home/puc/kafka_2.11-1.0.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1  --partitions 1 --topic aula1006
```

![...](./assets/subindo_topico.png)

### Verificando topicos existentes

Para verificar os topicos existentes, vamos utilizar o comando:

```
sudo /home/puc/kafka_2.11-1.0.0/bin/kafka-topics.sh --list --zookeeper localhost:2181
```
![...](./assets/verificando_topicos.png)

### Enviando valores com o Producer

Para enviar mensagens, precisamos executar dois comandos, um para o Producer e outro para o Consumer

Producer:

```
sudo /home/puc/kafka_2.11-1.0.0/bin/kafka-console-producer.sh --broker-list localhost:9092 --topic aula1006
```

Consumer:

```
sudo /home/puc/kafka_2.11-1.0.0/bin/kafka-console-consumer.sh --zookeeper localhost:2181 --topic aula1006 --from-beginning 
```

Após isso, enviamos mensagens do Producer para o Consumer, como na imagem abaixo:

![...](./assets/enviando_mensagens.png)


### Spool-to-logger

Para demonstrar o Flume, vamos criar 10 arquivos de texto aleatorios.


Para configurar nosso script com o spooldir, vamos alterar o arquivo.properties da seguinte forma

![...](./assets/spool_to_logger_propoerties.png)

Feito isso, navegue com o terminal até a pasta conf, existente no diretório do flume e abra o terminal a partir dali. no terminal execute o seguinte comando.

```
flume-ng agent --conf-file spool-to-kafka.properties --name agent1 -Dflume.root.logger=WARN,console
```

feito isso, mova os arquivos para a pasta de teste e observe o resultado

![...](./assets/flume_diretorios_2.png)


### Spool-to-kafka

Agora vamos testar o script spool-to-kafka. as seguintes configurações estão presentes:

![...](./assets/spool_kafka_properties.png)

Vamos criar o topico flume-topic para receber os dados dos arquivos que vamos movimentar para a pasta

Para iniciar o agente
```
flume-ng agent --conf-file spool-to-kafka.properties --name agent2 -Dflume.root.logger=WARN,console
```

Para iniciar o Consumer do topico kafka

```
sudo /home/puc/kafka_2.11-1.0.0/bin/kafka-console-consumer.sh --zookeeper localhost:2181 --topic flume-topic
```

note que quando movemos o arquivo para a pasta que está sendo monitorada, o conteudo do arquivo é listado no consumer

![...](./assets/spool_kafka_leitura_arquivos.png)


## 📋5 - Conclusão

A integração entre Apache Kafka e Apache Flume mostrou-se uma solução robusta e eficiente para ingestão e processamento de dados em tempo real. Durante este projeto, configuramos e testamos um ambiente virtualizado onde ambos os sistemas operaram em harmonia, demonstrando a capacidade de coletar, transportar e consumir dados de maneira fluida e contínua.

Configuramos um servidor Kafka e criamos tópicos, permitindo a produção e o consumo de mensagens através de scripts dedicados. O processo envolveu a utilização de comandos específicos para iniciar o servidor, criar tópicos e verificar tópicos existentes, assegurando a integridade e a disponibilidade dos dados.

Além disso, exploramos as capacidades do Apache Flume para ingerir dados de um diretório de spool diretamente para um tópico do Kafka. A configuração e execução dos agentes do Flume permitiram que dados fossem automaticamente ingeridos e consumidos, demonstrando a eficiência do pipeline de dados configurado.

Os testes realizados, tanto com mensagens simples quanto com arquivos de texto, confirmaram a eficácia das configurações implementadas. A integração Spool-to-Logger e Spool-to-Kafka mostrou que o sistema pode facilmente adaptar-se a diferentes fontes de dados e destinos, aumentando sua versatilidade em ambientes de produção.

Em resumo, este projeto destacou a sinergia entre Kafka e Flume, proporcionando uma compreensão aprofundada de suas configurações e capacidades. As práticas e técnicas aprendidas aqui são essenciais para qualquer profissional que deseje implementar soluções de ingestão de dados escaláveis e resilientes em um ambiente de big data.