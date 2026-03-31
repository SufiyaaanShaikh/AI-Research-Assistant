import { Paper, ResearchIdea } from './types'

export const mockPapers: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.', 'et al.'],
    year: 2017,
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture based on attention mechanisms alone, dispensing with recurrence and convolutions entirely.',
    keywords: ['transformer', 'attention', 'sequence-to-sequence', 'NLP', 'deep learning'],
    citations: 85000,
    summary: 'Introduces the Transformer architecture, which uses attention mechanisms instead of recurrence for sequence modeling. This work became foundational for modern NLP.',
    similarPapers: ['2', '3']
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Devlin, J.', 'Chang, M.-W.', 'Lee, K.', 'Toutanova, K.'],
    year: 2018,
    abstract: 'We introduce BERT, a new method of pre-training language representations. BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    keywords: ['BERT', 'pre-training', 'language models', 'bidirectional', 'transformers'],
    citations: 65000,
    summary: 'Presents BERT, a bidirectional pre-training approach for language understanding that achieves state-of-the-art results on multiple NLP tasks.',
    similarPapers: ['1', '4']
  },
  {
    id: '3',
    title: 'Language Models are Unsupervised Multitask Learners',
    authors: ['Radford, A.', 'Wu, J.', 'Child, R.', 'Luan, D.', 'Amodei, D.', 'Sutskever, I.'],
    year: 2019,
    abstract: 'We report on the development of GPT-2, a large-scale unsupervised language model. GPT-2 is a transformer-based language model with 1.5B parameters, trained on a new WebText dataset.',
    keywords: ['GPT-2', 'language models', 'zero-shot', 'transfer learning'],
    citations: 18000,
    summary: 'Introduces GPT-2, demonstrating that large-scale language models can perform diverse tasks without task-specific fine-tuning.',
    similarPapers: ['1', '5']
  },
  {
    id: '4',
    title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach',
    authors: ['Liu, Y.', 'Ott, M.', 'Goyal, N.', 'Du, J.', 'Joshi, M.', 'Chen, D.'],
    year: 2019,
    abstract: 'BERT and RoBERTa represent the state-of-the-art in transfer learning for NLP. We present RoBERTa, an optimized method for pretraining BERT models with improved downstream task performance.',
    keywords: ['RoBERTa', 'BERT', 'pre-training', 'optimization', 'NLP'],
    citations: 12000,
    summary: 'Improves upon BERT by optimizing the pre-training procedure, achieving better performance on multiple benchmark tasks.',
    similarPapers: ['2', '1']
  },
  {
    id: '5',
    title: 'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer',
    authors: ['Raffel, C.', 'Shazeer, N.', 'Roberts, A.', 'Lee, K.', 'Narang, S.', 'Matena, M.'],
    year: 2019,
    abstract: 'We explore the landscape of transfer learning for natural language processing. We introduce T5, a unified text-to-text transformer that treats all NLP problems as a text-to-text generation task.',
    keywords: ['T5', 'text-to-text', 'transfer learning', 'unified framework', 'NLP'],
    citations: 14000,
    summary: 'Proposes T5, which frames all NLP tasks as text-to-text generation, showing strong performance across diverse tasks.',
    similarPapers: ['1', '3']
  },
  {
    id: '6',
    title: 'Vision Transformer: An Image is Worth 16x16 Words',
    authors: ['Dosovitskiy, A.', 'Beyer, L.', 'Kolesnikov, A.', 'Weissenborn, D.', 'Zhai, X.'],
    year: 2020,
    abstract: 'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. We show that a pure transformer applied directly to sequences of image patches can perform very well on image classification tasks.',
    keywords: ['Vision Transformer', 'ViT', 'image classification', 'computer vision', 'transformers'],
    citations: 10000,
    summary: 'Introduces Vision Transformers, adapting the transformer architecture to image classification with competitive results.',
    similarPapers: ['1', '7']
  },
  {
    id: '7',
    title: 'CLIP: Learning Transferable Models For Computer Vision From Natural Language Supervision',
    authors: ['Radford, A.', 'Kim, J. W.', 'Hallacy, C.', 'Ramesh, A.', 'Goh, G.'],
    year: 2021,
    abstract: 'We propose a simple pre-training task of predicting which caption goes with which image. Learning this task from natural language supervision (image-text pairs) is efficient and scalable.',
    keywords: ['CLIP', 'vision-language', 'contrastive learning', 'zero-shot', 'multimodal'],
    citations: 8000,
    summary: 'Presents CLIP, connecting vision and language through contrastive learning for zero-shot image classification.',
    similarPapers: ['6', '1']
  }
]

export const mockResearchIdeas: ResearchIdea[] = [
  {
    id: '1',
    topic: 'Efficient Vision Transformers',
    description: 'Reduce computational complexity of Vision Transformers through knowledge distillation and attention pruning techniques',
    dataset: 'ImageNet, COCO',
    methodology: 'Empirical evaluation with baseline comparisons',
    potentialImpact: 'Enable deployment on edge devices',
    relatedFields: ['Computer Vision', 'Model Compression', 'Deep Learning']
  },
  {
    id: '2',
    topic: 'Multimodal Few-Shot Learning',
    description: 'Develop methods for few-shot learning that leverage both vision and language modalities',
    dataset: 'Custom multimodal dataset',
    methodology: 'Meta-learning approach with transformer architecture',
    potentialImpact: 'Improve adaptation to new tasks with limited data',
    relatedFields: ['Computer Vision', 'NLP', 'Meta-Learning']
  },
  {
    id: '3',
    topic: 'Interpretability in Large Language Models',
    description: 'Create interpretability techniques specific to attention mechanisms in large language models',
    dataset: 'Model activations from GPT-scale models',
    methodology: 'Activation analysis and feature attribution',
    potentialImpact: 'Better understanding of LLM decision-making',
    relatedFields: ['NLP', 'Interpretability', 'AI Safety']
  },
  {
    id: '4',
    topic: 'Continual Learning in Transformers',
    description: 'Prevent catastrophic forgetting in transformers when learning new tasks sequentially',
    dataset: 'Multiple domain-specific datasets',
    methodology: 'Experience replay and architectural adaptation',
    potentialImpact: 'Enable models to learn continuously over time',
    relatedFields: ['Continual Learning', 'Transformers', 'Transfer Learning']
  }
]
